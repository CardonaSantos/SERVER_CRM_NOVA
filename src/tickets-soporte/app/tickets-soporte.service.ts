import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateTicketsSoporteDto } from '../dto/create-tickets-soporte.dto';
import { UpdateTicketsSoporteDto } from '../dto/update-tickets-soporte.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloseTicketDto } from '../dto/CloseTicketDto .dto';
import { GenerarMensajeSoporteService } from '../generar-mensaje-soporte/generar-mensaje-soporte.service';
import { MetasTicketsService } from 'src/metas-tickets/metas-tickets.service';
import { UpdateTicketStatusDto } from '../dto/updateStatus';
import { WebSocketServices } from 'src/web-sockets/websocket.service';
import {
  EstadoTicketSoporte,
  Prisma,
  TicketSoporteTecnico,
} from '@prisma/client';
import {
  TICKET_SOPORTE_REPOSITORY,
  TicketSoporteRepository,
} from '../domain/ticket-soporte-repository';
import { CloudApiMetaService } from 'src/cloud-api-meta/cloud-api-meta.service';
import { formatearTelefonosMeta } from 'src/cloud-api-meta/helpers/cleantelefono';
import { ConfigService } from '@nestjs/config';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { CreateBotFunctionDto } from 'src/bot-functions/dto/create-bot-function.dto';
import { dayjs } from '../../Utils/dayjs.config';
import { TicketResumenService } from 'src/ticket-resumen/app/ticket-resumen.service';
import { CreateTicketResumenDto } from 'src/ticket-resumen/dto/create-ticket-resuman.dto';
import { QuerySearchTickets } from '../dto/querySearch';
import { query } from 'express';
import { TZ } from 'src/Utils/tzgt';
import { TicketFirmaTipo } from 'src/modules/ticket-soporte-conformidad/domain/enums/ticket-firma-tipo.enum';
import { FirebasePushService } from 'src/push-notifications/infra/firebase-push.service';
import {
  TicketHistorialCambio,
  TicketSoporteHistorialPrismaTxBridge,
} from 'src/modules/ticket-soporte-historial';
// import { dayjs } from '';

@Injectable()
export class TicketsSoporteService {
  private readonly logger = new Logger(TicketsSoporteService.name);

  private readonly estadosConFlujoDedicado = new Set<EstadoTicketSoporte>([
    EstadoTicketSoporte.EN_PROCESO,
    EstadoTicketSoporte.PENDIENTE_REVISION,
    EstadoTicketSoporte.RESUELTA,
    EstadoTicketSoporte.CERRADO,
  ]);

  private validarCambioEstadoGeneral(
    estadoActual: EstadoTicketSoporte,
    estadoSolicitado: EstadoTicketSoporte,
  ): void {
    if (estadoActual === estadoSolicitado) {
      return;
    }

    // if (this.estadosConFlujoDedicado.has(estadoSolicitado)) {
    //   throw new BadRequestException(
    //     `El cambio de estado ${estadoActual} → ${estadoSolicitado} debe realizarse mediante su flujo dedicado.`,
    //   );
    // }
  }

  // NUEVOS HELPERS
  // =========================================================
  // ASIGNACIONES DE TICKETS
  // =========================================================

  /**
   * Normaliza IDs de usuarios destinados a una asignación.
   *
   * - elimina null / undefined;
   * - elimina IDs inválidos;
   * - elimina duplicados.
   *
   * El nombre habla de "usuarios" deliberadamente.
   *
   * Aunque históricamente el dominio utiliza tecnicoId,
   * TicketSoporte.tecnico realmente relaciona Usuario, por
   * lo que el destinatario no tiene que poseer necesariamente
   * el rol TECNICO.
   */
  private normalizarUsuariosAsignados(
    userIds: readonly (number | null | undefined)[],
  ): number[] {
    return [
      ...new Set(
        userIds
          .map((userId) => Number(userId))
          .filter((userId) => Number.isInteger(userId) && userId > 0),
      ),
    ];
  }

  /**
   * Compara quién tenía acceso al ticket antes y quién
   * queda asignado después de la operación.
   *
   * Importante:
   *
   * No nos interesa si el usuario cambió de:
   *
   * principal -> acompañante
   * acompañante -> principal
   *
   * mientras continúe asignado al ticket.
   *
   * Solamente nos interesan altas y bajas reales.
   */
  private calcularCambiosAsignacion(
    anteriores: readonly number[],
    resultantes: readonly number[],
  ): {
    agregados: number[];
    removidos: number[];
  } {
    const anterioresSet = new Set(this.normalizarUsuariosAsignados(anteriores));

    const resultantesSet = new Set(
      this.normalizarUsuariosAsignados(resultantes),
    );

    const agregados = [...resultantesSet].filter(
      (userId) => !anterioresSet.has(userId),
    );

    const removidos = [...anterioresSet].filter(
      (userId) => !resultantesSet.has(userId),
    );

    return {
      agregados,
      removidos,
    };
  }

  /**
   * Efectos secundarios posteriores al COMMIT.
   *
   * Nunca debe ejecutarse dentro de una transacción Prisma.
   *
   * Flujo:
   *
   * 1. la DB confirma el cambio;
   * 2. Socket.IO informa inmediatamente a clientes conectados;
   * 3. FCM envía la notificación push a los dispositivos registrados;
   * 4. el cliente puede consultar inmediatamente por HTTP
   *    y observar el nuevo estado persistido.
   *
   * Ninguna falla de Socket.IO o Firebase debe revertir
   * una operación de ticket que ya fue confirmada en DB.
   */
  private async handleTicketAssignmentChanges(params: {
    ticket: {
      id: number;
      empresaId: number | null;
      titulo: string;
      estado: EstadoTicketSoporte;
      prioridad: string;
    };

    addedUserIds: readonly number[];
    removedUserIds: readonly number[];

    reason: 'CREATED' | 'REASSIGNED';
  }): Promise<void> {
    const addedUserIds = this.normalizarUsuariosAsignados(params.addedUserIds);

    const removedUserIds = this.normalizarUsuariosAsignados(
      params.removedUserIds,
    );

    if (addedUserIds.length === 0 && removedUserIds.length === 0) {
      return;
    }

    /**
     * Los tickets históricos permiten empresaId nullable.
     *
     * Para eventos operativos del CRM exigimos contexto
     * empresarial válido antes de propagarlos.
     */
    if (!params.ticket.empresaId || params.ticket.empresaId <= 0) {
      this.logger.warn(
        [
          'Cambio de asignación sin notificación realtime/push',
          `ticketId=${params.ticket.id}`,
          'motivo=empresaId ausente',
        ].join(' | '),
      );

      return;
    }

    const occurredAt = new Date().toISOString();

    /**
     * =====================================================
     * REALTIME
     * =====================================================
     *
     * Socket.IO sincroniza inmediatamente los clientes
     * actualmente conectados.
     */
    const realtimeTasks: Promise<unknown>[] = [
      this.ws.emitTicketAssignmentChanged({
        userIds: addedUserIds,

        payload: {
          version: 1,
          ticketId: params.ticket.id,
          empresaId: params.ticket.empresaId,
          change: 'ASSIGNED',
          reason: params.reason,
          title: params.ticket.titulo,
          status: params.ticket.estado,
          priority: params.ticket.prioridad,
          occurredAt,
        },
      }),

      this.ws.emitTicketAssignmentChanged({
        userIds: removedUserIds,

        payload: {
          version: 1,
          ticketId: params.ticket.id,
          empresaId: params.ticket.empresaId,
          change: 'UNASSIGNED',
          reason: params.reason,
          title: params.ticket.titulo,
          status: params.ticket.estado,
          priority: params.ticket.prioridad,
          occurredAt,
        },
      }),
    ];

    /**
     * =====================================================
     * PUSH
     * =====================================================
     *
     * FCM cubre principalmente:
     *
     * - aplicación en background;
     * - aplicación terminada;
     * - dispositivo sin Socket.IO activo.
     *
     * Cada usuario puede tener múltiples dispositivos.
     */
    const pushTasks: Promise<unknown>[] = [
      ...addedUserIds.map((userId) =>
        this.emitTicketAssignmentPush({
          userId,

          ticket: {
            id: params.ticket.id,
            titulo: params.ticket.titulo,
            estado: params.ticket.estado,
            prioridad: params.ticket.prioridad,
          },

          change: 'ASSIGNED',
          reason: params.reason,
        }),
      ),

      ...removedUserIds.map((userId) =>
        this.emitTicketAssignmentPush({
          userId,

          ticket: {
            id: params.ticket.id,
            titulo: params.ticket.titulo,
            estado: params.ticket.estado,
            prioridad: params.ticket.prioridad,
          },

          change: 'UNASSIGNED',
          reason: params.reason,
        }),
      ),
    ];

    /**
     * Ejecutamos ambos canales concurrentemente.
     *
     * allSettled aporta una segunda barrera de aislamiento:
     * aunque algún adapter inesperadamente rechace la Promise,
     * no propagamos ese fallo hacia la operación del ticket.
     */
    const results = await Promise.allSettled([...realtimeTasks, ...pushTasks]);

    const rejectedCount = results.filter(
      (result) => result.status === 'rejected',
    ).length;

    if (rejectedCount > 0) {
      this.logger.warn(
        [
          'Uno o más efectos secundarios de asignación fallaron',
          `ticketId=${params.ticket.id}`,
          `failed=${rejectedCount}`,
        ].join(' | '),
      );
    }

    this.logger.log(
      [
        'Cambios de asignación procesados',
        `ticketId=${params.ticket.id}`,
        `added=[${addedUserIds.join(',')}]`,
        `removed=[${removedUserIds.join(',')}]`,
        `realtimeEvents=2`,
        `pushTargets=${addedUserIds.length + removedUserIds.length}`,
      ].join(' | '),
    );
  }

  // NUEVOS HELPERS
  constructor(
    @Inject(TICKET_SOPORTE_REPOSITORY)
    private readonly ticketsRepo: TicketSoporteRepository,
    private readonly prisma: PrismaService,
    // private readonly twilioMessageSuport: GenerarMensajeSoporteService,
    private readonly metasTicketSoporte: MetasTicketsService,
    private readonly ws: WebSocketServices,

    private readonly configService: ConfigService,

    private readonly cloudApi: CloudApiMetaService,
    private readonly ticketResumen: TicketResumenService,

    private readonly firebasePush: FirebasePushService,

    private readonly ticketHistorialTx: TicketSoporteHistorialPrismaTxBridge,
  ) {}

  // ===================== CREATE =====================
  async create(createTicketsSoporteDto: CreateTicketsSoporteDto) {
    this.logger.log(
      `DTO recibido en TicketSoporteService:\n${JSON.stringify(createTicketsSoporteDto, null, 2)}`,
    );

    const ahora = dayjs().toDate();

    const tecnicoPrincipalId = createTicketsSoporteDto.tecnicoId ?? null;

    const tecnicosAdicionales = [
      ...new Set(
        (createTicketsSoporteDto.tecnicosAdicionales ?? [])
          .map(Number)
          .filter(
            (tecnicoId) =>
              Number.isInteger(tecnicoId) &&
              tecnicoId > 0 &&
              tecnicoId !== tecnicoPrincipalId,
          ),
      ),
    ];

    const tieneAsignacionInicial =
      Boolean(createTicketsSoporteDto.tecnicoId) ||
      tecnicosAdicionales.length > 0;

    const usuariosAsignadosInicialmente = this.normalizarUsuariosAsignados([
      tecnicoPrincipalId,
      ...tecnicosAdicionales,
    ]);

    const ticketCreated = await this.prisma.$transaction(async (tx) => {
      const newTicketSoporte = await tx.ticketSoporte.create({
        data: {
          fechaApertura: ahora,
          fechaAsignacion: tieneAsignacionInicial ? ahora : null,

          // Campos escalares
          titulo: createTicketsSoporteDto.titulo,
          descripcion: createTicketsSoporteDto.descripcion,
          prioridad: createTicketsSoporteDto.prioridad,
          estado: createTicketsSoporteDto.estado,

          cliente: createTicketsSoporteDto.clienteId
            ? { connect: { id: createTicketsSoporteDto.clienteId } }
            : undefined,

          creadoPor: createTicketsSoporteDto.userId
            ? { connect: { id: createTicketsSoporteDto.userId } }
            : undefined,

          empresa: createTicketsSoporteDto.empresaId
            ? { connect: { id: createTicketsSoporteDto.empresaId } }
            : undefined,

          tecnico: createTicketsSoporteDto.tecnicoId
            ? { connect: { id: createTicketsSoporteDto.tecnicoId } }
            : undefined,

          asignaciones:
            tecnicosAdicionales.length > 0
              ? {
                  create: tecnicosAdicionales.map((tecnicoId) => ({
                    tecnicoId,
                  })),
                }
              : undefined,

          etiquetas:
            createTicketsSoporteDto.etiquetas?.length > 0
              ? {
                  create: createTicketsSoporteDto.etiquetas.map((tagId) => ({
                    etiqueta: {
                      connect: { id: tagId },
                    },
                  })),
                }
              : undefined,
        },
      });

      return newTicketSoporte;
    });

    // =====================================================
    // REALTIME - ASIGNACIÓN INICIAL
    // =====================================================
    //
    // A estas alturas Prisma ya confirmó la transacción.
    //
    // Si el ticket se creó sin usuarios asignados, el
    // handler simplemente retorna sin emitir nada.
    // =====================================================

    await this.handleTicketAssignmentChanges({
      ticket: ticketCreated,

      addedUserIds: usuariosAsignadosInicialmente,

      removedUserIds: [],

      reason: 'CREATED',
    });

    let customer;

    if (ticketCreated.clienteId) {
      customer = await this.prisma.clienteInternet.findUnique({
        where: {
          id: ticketCreated.clienteId,
        },
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          telefono: true,
          contactoReferenciaTelefono: true,
          empresa: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });
    }

    const templateName = this.configService.get('TICKET_PLANTILLA_SID');

    const variablesPlantilla = [
      `${customer?.nombre ?? ''} ${customer?.apellidos ?? ''}`.trim() ||
        'Estimado Cliente',
      `${ticketCreated?.titulo ?? 'N/A'}`,
      `${ticketCreated?.id ?? 9999}`,
      `N/A`,
    ];
    const telefonosRaw = [
      customer?.telefono ?? customer?.contactoReferenciaTelefono,
      createTicketsSoporteDto?.telefonoTemporal,
    ];

    const telefonos = formatearTelefonosMeta(telefonosRaw).filter(Boolean);
    this.logger.log('Los telefonos a usar son: ', telefonos);
    try {
      for (const telefono of telefonos) {
        const payload = this.cloudApi.crearPayloadTicket(
          telefono,
          templateName,
          variablesPlantilla,
        );
        await this.cloudApi.enviarMensaje(payload);
      }
    } catch (err) {
      this.logger.error(
        `Error enviando notificación Meta para ticket ${ticketCreated.id}`,
        err,
      );
    }
    return ticketCreated;
  }

  async createBotTicket(dto: CreateBotFunctionDto) {
    try {
      const { descripcion, titulo } = dto;

      const desc = `${descripcion}     ~ Creado por Botsito`;

      const ticket = await this.prisma.$transaction(async (tx) => {
        return tx.ticketSoporte.create({
          data: {
            titulo,
            descripcion: desc,
            estado: 'NUEVO',
            fijado: true,
            prioridad: 'URGENTE',
          },
        });
      });

      this.logger.log(`Ticket creado:\n${JSON.stringify(ticket, null, 2)}`);
      return ticket;
    } catch (error) {
      throwFatalError(error, this.logger, 'TicketSoporte -createBotTicket');
    }
  }

  // ===================== READ =====================
  async getTicketToBoleta(ticketId: number) {
    try {
      const ticketInfo = await this.prisma.ticketSoporte.findUnique({
        where: {
          id: ticketId,
        },

        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              direccion: true,
            },
          },

          empresa: {
            select: {
              id: true,
              nombre: true,
              correo: true,
              telefono: true,
              direccion: true,
              pbx: true,
            },
          },

          tecnico: {
            select: {
              id: true,
              nombre: true,
            },
          },

          /*
           * Nos interesa el ciclo de conformidad
           * más reciente del ticket.
           */
          ticketsConformidad: {
            orderBy: [
              {
                creadoEn: 'desc',
              },
              {
                id: 'desc',
              },
            ],

            take: 1,

            select: {
              id: true,
              resultado: true,
              creadoEn: true,
              respondidoEn: true,

              firmas: {
                select: {
                  id: true,
                  tipo: true,

                  nombreFirmante: true,
                  telefonoFirmante: true,

                  usuarioFirmanteId: true,

                  firmadoEn: true,

                  media: {
                    select: {
                      id: true,
                      cdnUrl: true,
                      mimeType: true,
                      tamanioBytes: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!ticketInfo) {
        throw new NotFoundException('Ticket no encontrado');
      }

      const conformidadActual = ticketInfo.ticketsConformidad[0] ?? null;

      const firmaCliente =
        conformidadActual?.firmas.find(
          (firma) => firma.tipo === TicketFirmaTipo.CLIENTE,
        ) ?? null;

      const firmaTecnico =
        conformidadActual?.firmas.find(
          (firma) => firma.tipo === TicketFirmaTipo.TECNICO,
        ) ?? null;

      const boletaData = {
        ticketId: ticketInfo.id,

        titulo: ticketInfo.titulo ?? 'Sin título',

        descripcion: ticketInfo.descripcion ?? 'Sin descripción',

        estado: ticketInfo.estado,

        prioridad: ticketInfo.prioridad,

        fechaApertura: ticketInfo.fechaApertura,

        fechaCierre: ticketInfo.fechaCierre ?? null,

        cliente: ticketInfo.cliente
          ? {
              id: ticketInfo.cliente.id,

              nombreCompleto:
                `${ticketInfo.cliente.nombre ?? ''} ${
                  ticketInfo.cliente.apellidos ?? ''
                }`.trim() || 'Cliente sin nombre',

              telefono: ticketInfo.cliente.telefono ?? 'N/A',

              direccion: ticketInfo.cliente.direccion ?? 'N/A',
            }
          : null,

        tecnico: ticketInfo.tecnico
          ? {
              id: ticketInfo.tecnico.id,

              nombre: ticketInfo.tecnico.nombre,
            }
          : null,

        empresa: {
          id: ticketInfo.empresa?.id,

          nombre: ticketInfo.empresa?.nombre ?? 'Empresa no asignada',

          direccion: ticketInfo.empresa?.direccion ?? 'N/A',

          correo: ticketInfo.empresa?.correo ?? 'N/A',

          telefono: ticketInfo.empresa?.telefono ?? 'N/A',

          pbx: ticketInfo.empresa?.pbx ?? 'N/A',
        },

        /*
         * Información del ciclo utilizado
         * para construir la boleta.
         */
        conformidad: conformidadActual
          ? {
              id: conformidadActual.id,

              resultado: conformidadActual.resultado,

              creadoEn: conformidadActual.creadoEn,

              respondidoEn: conformidadActual.respondidoEn,
            }
          : null,

        firmaCliente: firmaCliente
          ? {
              id: firmaCliente.id,

              nombreFirmante: firmaCliente.nombreFirmante,

              telefonoFirmante: firmaCliente.telefonoFirmante,

              firmadoEn: firmaCliente.firmadoEn,

              mediaId: firmaCliente.media.id,

              url: firmaCliente.media.cdnUrl,

              mimeType: firmaCliente.media.mimeType,

              tamanioBytes: firmaCliente.media.tamanioBytes.toString(),
            }
          : null,

        firmaTecnico: firmaTecnico
          ? {
              id: firmaTecnico.id,

              usuarioFirmanteId: firmaTecnico.usuarioFirmanteId,

              nombreFirmante: firmaTecnico.nombreFirmante,

              firmadoEn: firmaTecnico.firmadoEn,

              mediaId: firmaTecnico.media.id,

              url: firmaTecnico.media.cdnUrl,

              mimeType: firmaTecnico.media.mimeType,

              tamanioBytes: firmaTecnico.media.tamanioBytes.toString(),
            }
          : null,

        fechaGeneracionBoleta: new Date().toISOString(),
      };

      return boletaData;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Error al generar boleta de ticket:', error);

      throw new InternalServerErrorException('Error al generar boleta');
    }
  }

  // Obtener todos los tickets con sus detalles y comentarios
  async getTickets(query: QuerySearchTickets) {
    try {
      // =====================================================
      // ESTADOS POR VISTA
      // =====================================================
      //
      // Centralizamos los estados para evitar diferencias
      // entre:
      //
      // - los tickets que muestra cada tab
      // - el contador mostrado por cada tab
      //
      // =====================================================

      const estadosResueltos: EstadoTicketSoporte[] = [
        EstadoTicketSoporte.RESUELTA,
        EstadoTicketSoporte.CERRADO,
      ];

      const estadosEnProceso: EstadoTicketSoporte[] = [
        EstadoTicketSoporte.EN_PROCESO,
        EstadoTicketSoporte.PENDIENTE,
        EstadoTicketSoporte.PENDIENTE_CLIENTE,
        EstadoTicketSoporte.PENDIENTE_TECNICO,
        EstadoTicketSoporte.PENDIENTE_REVISION,
      ];

      const estadosCancelados: EstadoTicketSoporte[] = [
        EstadoTicketSoporte.CANCELADA,
      ];

      const estadosFueraDeInbox: EstadoTicketSoporte[] = [
        ...estadosResueltos,
        EstadoTicketSoporte.ARCHIVADA,
        ...estadosCancelados,
      ];

      // =====================================================
      // FILTRO BASE SEGÚN LA TAB SELECCIONADA
      // =====================================================

      const baseWhere: Prisma.TicketSoporteWhereInput = (() => {
        switch (query.vista) {
          // =================================================
          // RESUELTOS
          // =================================================
          case 'lista':
            return {
              estado: {
                in: estadosResueltos,
              },
            };

          // =================================================
          // EN PROCESO
          // =================================================
          case 'enProceso':
            return {
              estado: {
                in: estadosEnProceso,
              },
            };

          // =================================================
          // CANCELADOS
          // =================================================
          case 'cancelados':
            return {
              estado: {
                in: estadosCancelados,
              },
            };

          // =================================================
          // TODOS / INBOX
          // =================================================
          case 'inbox':
          default:
            return {
              estado: {
                notIn: estadosFueraDeInbox,
              },
            };
        }
      })();

      // =====================================================
      // BÚSQUEDA POR ID
      // =====================================================

      const searchID = Number(query.search);

      // =====================================================
      // FILTROS QUE NECESITAN OR
      // =====================================================
      //
      // Los dejamos dentro de AND para poder combinar:
      //
      // - búsqueda
      // - técnico principal
      // - técnico adicional
      //
      // sin que un OR reemplace al otro.
      //
      // =====================================================

      const andFilters: Prisma.TicketSoporteWhereInput[] = [];

      // =====================================================
      // FILTRO POR TÉCNICO
      // =====================================================
      //
      // Puede ser:
      //
      // - técnico principal
      // - técnico adicional
      //
      // =====================================================

      if (query.tecs?.length) {
        andFilters.push({
          OR: [
            {
              tecnicoId: {
                in: query.tecs,
              },
            },
            {
              asignaciones: {
                some: {
                  tecnicoId: {
                    in: query.tecs,
                  },
                },
              },
            },
          ],
        });
      }

      // =====================================================
      // FILTRO DE BÚSQUEDA
      // =====================================================

      if (query.search) {
        andFilters.push({
          OR: [
            {
              titulo: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
            {
              cliente: {
                nombre: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            },
            {
              descripcion: {
                contains: query.search,
                mode: 'insensitive',
              },
            },

            ...(!Number.isNaN(searchID)
              ? [
                  {
                    id: {
                      equals: searchID,
                    },
                  },
                ]
              : []),
          ],
        });
      }

      // =====================================================
      // WHERE FINAL
      // =====================================================

      const where: Prisma.TicketSoporteWhereInput = {
        ...baseWhere,

        // ===================================================
        // CREADO POR
        // ===================================================

        ...(query.creadosPor && {
          creadoPorId: query.creadosPor,
        }),

        // ===================================================
        // SECTOR
        // ===================================================

        ...(query.sector && {
          cliente: {
            sectorId: {
              equals: query.sector,
            },
          },
        }),

        // ===================================================
        // ETIQUETAS
        // ===================================================

        ...(query.tags?.length && {
          etiquetas: {
            some: {
              etiquetaId: {
                in: query.tags,
              },
            },
          },
        }),

        // ===================================================
        // FECHA
        // ===================================================

        ...(query.fechaInicio &&
          query.fechaFin && {
            fechaApertura: {
              gte: new Date(query.fechaInicio),
              lte: new Date(query.fechaFin),
            },
          }),

        // ===================================================
        // FILTROS OR AGRUPADOS
        // ===================================================

        ...(andFilters.length > 0 && {
          AND: andFilters,
        }),
      };

      this.logger.log(
        `Where:\n${JSON.stringify(
          {
            query,
            where,
          },
          null,
          2,
        )}`,
      );

      // =====================================================
      // PAGINACIÓN
      // =====================================================

      const page = query.page ?? 1;
      const limit = query.limit ?? 10;

      // =====================================================
      // CONSULTAS
      // =====================================================

      const [
        tickets,
        counts,
        ticketsDisponibles,
        ticketEnProceso,
        ticketsResueltos,
        ticketsCancelados,
      ] = await Promise.all([
        // ===================================================
        // LISTADO ACTUAL
        // ===================================================

        this.prisma.ticketSoporte.findMany({
          where,

          orderBy: [
            {
              fijado: 'desc',
            },
            {
              creadoEn: 'desc',
            },
            {
              id: 'desc',
            },
          ],

          skip: (page - 1) * limit,
          take: limit,

          select: {
            id: true,

            titulo: true,
            descripcion: true,

            estado: true,
            prioridad: true,

            fijado: true,

            // =================================================
            // TÉCNICO PRINCIPAL
            // =================================================

            tecnico: {
              select: {
                id: true,
                nombre: true,
              },
            },

            // =================================================
            // TÉCNICOS ADICIONALES
            // =================================================

            asignaciones: {
              select: {
                tecnico: {
                  select: {
                    id: true,
                    nombre: true,
                    rol: true,
                  },
                },
              },
            },

            // =================================================
            // CREADOR
            // =================================================

            creadoPor: {
              select: {
                id: true,
                nombre: true,
                rol: true,
              },
            },

            // =================================================
            // CLIENTE
            // =================================================

            cliente: {
              select: {
                id: true,
                nombre: true,
                apellidos: true,
              },
            },

            // =================================================
            // CICLO TEMPORAL
            // =================================================

            fechaApertura: true,
            fechaAsignacion: true,
            fechaInicioAtencion: true,
            fechaResolucionTecnico: true,
            fechaCierre: true,

            // =================================================
            // ETIQUETAS
            // =================================================

            etiquetas: {
              select: {
                etiqueta: {
                  select: {
                    nombre: true,
                    id: true,
                  },
                },
              },
            },

            // =================================================
            // SEGUIMIENTO
            // =================================================

            SeguimientoTicket: {
              select: {
                descripcion: true,
                fechaRegistro: true,

                usuario: {
                  select: {
                    id: true,
                    nombre: true,

                    perfil: {
                      select: {
                        avatarUrl: true,
                        bio: true,
                        portadaUrl: true,
                      },
                    },
                  },
                },
              },
            },

            // =================================================
            // LOGS DE TIEMPO
            // =================================================

            logsTiempo: {
              select: {
                id: true,
                inicio: true,
                fin: true,
                duracionMinutos: true,
              },
            },

            // =================================================
            // RESUMEN
            // =================================================

            resumen: {
              select: {
                id: true,

                notasInternas: true,
                resueltoComo: true,

                tiempoTotalMinutos: true,
                tiempoTecnicoMinutos: true,

                solucion: {
                  select: {
                    id: true,
                    solucion: true,
                    descripcion: true,
                  },
                },
              },
            },
          },
        }),

        // ===================================================
        // TOTAL DE LA VISTA ACTUAL
        // ===================================================
        //
        // Este count sí usa todos los filtros actuales.
        //
        // Sirve para la paginación.
        //
        // ===================================================

        this.prisma.ticketSoporte.count({
          where,
        }),

        // ===================================================
        // CONTADOR: TODOS / INBOX
        // ===================================================

        this.prisma.ticketSoporte.count({
          where: {
            estado: {
              notIn: estadosFueraDeInbox,
            },
          },
        }),

        // ===================================================
        // CONTADOR: EN PROCESO
        // ===================================================

        this.prisma.ticketSoporte.count({
          where: {
            estado: {
              in: estadosEnProceso,
            },
          },
        }),

        // ===================================================
        // CONTADOR: RESUELTOS
        // ===================================================

        this.prisma.ticketSoporte.count({
          where: {
            estado: {
              in: estadosResueltos,
            },
          },
        }),

        // ===================================================
        // CONTADOR: CANCELADOS
        // ===================================================

        this.prisma.ticketSoporte.count({
          where: {
            estado: {
              in: estadosCancelados,
            },
          },
        }),
      ]);

      // =====================================================
      // FORMATEO
      // =====================================================

      const ahora = dayjs();

      const ticketsFormateados = tickets.map((ticket) => {
        // ===================================================
        // TÉCNICOS ADICIONALES ÚNICOS
        // ===================================================

        const acompanantesMap = new Map<
          number,
          {
            id: number;
            name: string;
            rol: (typeof ticket.asignaciones)[number]['tecnico']['rol'];
          }
        >();

        for (const { tecnico } of ticket.asignaciones) {
          // Evitar mostrar al técnico principal también
          // como acompañante.

          if (ticket.tecnico?.id === tecnico.id) {
            continue;
          }

          acompanantesMap.set(tecnico.id, {
            id: tecnico.id,
            name: tecnico.nombre,
            rol: tecnico.rol,
          });
        }

        const acompanantes = [...acompanantesMap.values()];

        // ===================================================
        // TIEMPO TÉCNICO ACTUAL
        // ===================================================
        //
        // Logs cerrados:
        //   duracionMinutos
        //
        // Log actualmente abierto:
        //   inicio -> ahora
        //
        // Esto permite mantener el valor "live" mientras
        // el ticket se encuentra trabajando.
        //
        // ===================================================

        const tiempoTecnicoLive = ticket.logsTiempo.reduce((total, log) => {
          if (log.fin === null) {
            const minutosEnCurso = Math.max(
              ahora.diff(dayjs(log.inicio), 'minutes'),
              0,
            );

            return total + minutosEnCurso;
          }

          return total + (log.duracionMinutos ?? 0);
        }, 0);

        // ===================================================
        // MÉTRICAS CONSOLIDADAS
        // ===================================================
        //
        // Una vez que existe TicketResumen, utilizamos
        // sus valores históricos.
        //
        // Mientras no exista, calculamos desde los logs.
        //
        // ===================================================

        const tiempoTecnicoDisplay =
          ticket.resumen?.tiempoTecnicoMinutos ?? tiempoTecnicoLive;

        const tiempoTotalDisplay = ticket.resumen?.tiempoTotalMinutos ?? null;

        // ===================================================
        // RESPUESTA DEL TICKET
        // ===================================================

        return {
          id: ticket.id,

          title: ticket.titulo,
          description: ticket.descripcion,

          status: ticket.estado,
          priority: ticket.prioridad,

          fixed: ticket.fijado,

          // =================================================
          // USUARIOS
          // =================================================

          assignee: ticket.tecnico
            ? {
                id: ticket.tecnico.id,
                name: ticket.tecnico.nombre,
                initials: ticket.tecnico.nombre.slice(0, 2).toUpperCase(),
              }
            : null,

          companios: acompanantes,

          creator: ticket.creadoPor
            ? {
                id: ticket.creadoPor.id,
                name: ticket.creadoPor.nombre,

                initials: ticket.creadoPor.nombre
                  ? ticket.creadoPor.nombre.slice(0, 2).toUpperCase()
                  : '?',

                rol: ticket.creadoPor.rol,
              }
            : {
                id: 0,
                name: 'Sistema (Bot)',
                initials: 'BT',
                rol: 'SISTEMA',
              },

          // =================================================
          // CLIENTE
          // =================================================

          customer: ticket.cliente
            ? {
                id: ticket.cliente.id,

                name:
                  `${ticket.cliente.nombre ?? ''} ${
                    ticket.cliente.apellidos ?? ''
                  }`.trim() || 'Cliente sin nombre',
              }
            : null,

          // =================================================
          // FECHAS
          // =================================================

          date: ticket.fechaApertura.toISOString(),

          assignedAt: ticket.fechaAsignacion?.toISOString() ?? null,

          attentionStartedAt: ticket.fechaInicioAtencion?.toISOString() ?? null,

          technicalResolvedAt:
            ticket.fechaResolucionTecnico?.toISOString() ?? null,

          closedAt: ticket.fechaCierre?.toISOString() ?? null,

          // =================================================
          // LEÍDO / NO LEÍDO
          // =================================================

          unread: ticket.estado === EstadoTicketSoporte.ABIERTA,

          // =================================================
          // ETIQUETAS
          // =================================================

          tags: ticket.etiquetas.map((tag) => ({
            label: tag.etiqueta.nombre,
            value: tag.etiqueta.id,
          })),

          // =================================================
          // COMENTARIOS
          // =================================================

          comments: ticket.SeguimientoTicket.map((comment) => ({
            user: comment.usuario
              ? {
                  id: comment.usuario.id,
                  name: comment.usuario.nombre,

                  initials: comment.usuario.nombre
                    ? comment.usuario.nombre.slice(0, 2).toUpperCase()
                    : '?',

                  perfil: {
                    avatar: comment.usuario.perfil?.avatarUrl ?? null,

                    portadaUrl: comment.usuario.perfil?.portadaUrl ?? null,

                    bio: comment.usuario.perfil?.bio ?? null,
                  },
                }
              : {
                  id: -1,
                  name: 'Usuario eliminado',
                  initials: 'NA',

                  perfil: {
                    avatar: null,
                    portadaUrl: null,
                    bio: null,
                  },
                },

            text: comment.descripcion,

            date: comment.fechaRegistro.toISOString(),
          })),

          // =================================================
          // MÉTRICAS
          // =================================================

          metrics: {
            // Tiempo realmente trabajado según TicketTimeLog.

            timeSpentMinutes: tiempoTecnicoDisplay,

            // Duración calendario apertura -> cierre.
            //
            // Utilizamos el valor consolidado cuando existe.

            totalElapsedMinutes: tiempoTotalDisplay,

            logsCount: ticket.logsTiempo.length,

            resolution: ticket.resumen
              ? {
                  solutionName:
                    ticket.resumen.solucion?.solucion ?? 'Sin categoría',

                  solutionDesc: ticket.resumen.solucion?.descripcion ?? null,

                  resolutionNote: ticket.resumen.resueltoComo,

                  internalNote: ticket.resumen.notasInternas,
                }
              : null,
          },
        };
      });

      // =====================================================
      // PAGINACIÓN FINAL
      // =====================================================

      const total = counts;

      const totalPages = Math.ceil(total / limit);

      // =====================================================
      // RESPONSE
      // =====================================================

      return {
        data: ticketsFormateados,

        ticketsData: {
          ticketsDisponibles,
          ticketEnProceso,
          ticketsResueltos,
          ticketsCancelados,
        },

        meta: {
          page,
          limit,

          total,
          totalPages,

          hasNextPage: page < totalPages,

          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Error al obtener los tickets:', error);

      throw new InternalServerErrorException('No se pudo obtener los tickets');
    }
  }

  // ===================== UPDATE GENERAL =====================
  // ===================== UPDATE GENERAL =====================

  async update(id: number, updateTicketsSoporteDto: UpdateTicketsSoporteDto) {
    this.logger.debug('ID Actualización: ', id);

    this.logger.log(
      `UpdateTicketsSoporteDto:\n${JSON.stringify(
        updateTicketsSoporteDto,
        null,
        2,
      )}`,
    );

    /**
     * =======================================================
     * TRANSACTION
     * =======================================================
     *
     * Todo cambio persistente ocurre aquí:
     *
     * - TicketSoporte
     * - etiquetas
     * - asignaciones secundarias
     * - historial
     *
     * Si cualquiera falla:
     * ROLLBACK completo.
     *
     * Socket.IO / Push permanecen fuera de la transacción.
     * =======================================================
     */
    const transactionResult = await this.prisma.$transaction(async (tx) => {
      // ===================================================
      // SNAPSHOT ANTERIOR
      // ===================================================

      const ticketActual = await tx.ticketSoporte.findUnique({
        where: {
          id,
        },

        select: {
          id: true,

          titulo: true,
          descripcion: true,

          estado: true,
          prioridad: true,

          fijado: true,

          tecnicoId: true,
          clienteId: true,

          fechaAsignacion: true,

          asignaciones: {
            select: {
              tecnicoId: true,
            },
          },

          etiquetas: {
            select: {
              etiquetaId: true,
            },
          },
        },
      });

      if (!ticketActual) {
        throw new NotFoundException(`Ticket con id ${id} no encontrado`);
      }

      // ===================================================
      // ACTOR DEL CAMBIO
      // ===================================================

      const actorUsuarioId = updateTicketsSoporteDto.userId ?? null;

      let actor: {
        id: number;
        nombre: string;
      } | null = null;

      if (actorUsuarioId) {
        actor = await tx.usuario.findUnique({
          where: {
            id: actorUsuarioId,
          },

          select: {
            id: true,
            nombre: true,
          },
        });

        if (!actor) {
          throw new BadRequestException(
            `El usuario actor ${actorUsuarioId} no existe.`,
          );
        }
      }

      // ===================================================
      // ESTADO RESULTANTE
      // ===================================================

      const estadoResultante =
        updateTicketsSoporteDto.status ?? ticketActual.estado;

      this.validarCambioEstadoGeneral(ticketActual.estado, estadoResultante);

      // ===================================================
      // ASIGNACIONES ANTERIORES
      // ===================================================

      const adicionalesAnteriores = this.normalizarUsuariosAsignados(
        ticketActual.asignaciones.map((asignacion) => asignacion.tecnicoId),
      );

      const usuariosAsignadosAntes = this.normalizarUsuariosAsignados([
        ticketActual.tecnicoId,
        ...adicionalesAnteriores,
      ]);

      // ===================================================
      // TÉCNICO PRINCIPAL RESULTANTE
      // ===================================================
      //
      // Compatibilidad temporal:
      //
      // tecnicoId
      // assignee
      //
      // Si ninguno fue enviado:
      // conservamos el actual.
      // ===================================================

      const tecnicoPrincipalFueEnviado =
        updateTicketsSoporteDto.tecnicoId !== undefined ||
        updateTicketsSoporteDto.assignee !== undefined;

      const tecnicoPrincipalSolicitado =
        updateTicketsSoporteDto.tecnicoId ??
        updateTicketsSoporteDto.assignee?.id ??
        null;

      const tecnicoPrincipalResultante = tecnicoPrincipalFueEnviado
        ? tecnicoPrincipalSolicitado
        : ticketActual.tecnicoId;

      // ===================================================
      // TÉCNICOS ADICIONALES RESULTANTES
      // ===================================================
      //
      // Compatibilidad temporal:
      //
      // tecnicosAdicionales
      // companios
      // ===================================================

      const adicionalesFueronEnviados =
        updateTicketsSoporteDto.tecnicosAdicionales !== undefined ||
        updateTicketsSoporteDto.companios !== undefined;

      const adicionalesRaw =
        updateTicketsSoporteDto.tecnicosAdicionales ??
        updateTicketsSoporteDto.companios ??
        [];

      const adicionalesSolicitados = this.normalizarUsuariosAsignados(
        adicionalesRaw,
      ).filter((userId) => userId !== tecnicoPrincipalResultante);

      /**
       * Si la colección secundaria no fue enviada,
       * conservamos la anterior.
       *
       * Pero si un acompañante pasó a ser principal,
       * lo quitamos de los adicionales.
       */
      const adicionalesResultantes = adicionalesFueronEnviados
        ? adicionalesSolicitados
        : adicionalesAnteriores.filter(
            (userId) => userId !== tecnicoPrincipalResultante,
          );

      const usuariosAsignadosDespues = this.normalizarUsuariosAsignados([
        tecnicoPrincipalResultante,
        ...adicionalesResultantes,
      ]);

      const assignmentChanges = this.calcularCambiosAsignacion(
        usuariosAsignadosAntes,
        usuariosAsignadosDespues,
      );

      // ===================================================
      // ETIQUETAS ANTERIORES
      // ===================================================

      const etiquetasAnteriores = [
        ...new Set(
          ticketActual.etiquetas.map((relacion) => relacion.etiquetaId),
        ),
      ].sort((a, b) => a - b);

      let etiquetasResultantes = [...etiquetasAnteriores];

      // ===================================================
      // NORMALIZAR Y VALIDAR ETIQUETAS
      // ===================================================
      //
      // Contrato:
      //
      // undefined
      // → no modificar
      //
      // []
      // → eliminar todas
      //
      // [1, 3]
      // → estado final = etiquetas 1 y 3
      // ===================================================

      if (updateTicketsSoporteDto.tags !== undefined) {
        const tagIds = updateTicketsSoporteDto.tags.map((tagId) =>
          Number(tagId),
        );

        const tieneTagInvalido = tagIds.some(
          (tagId) => !Number.isInteger(tagId) || tagId <= 0,
        );

        if (tieneTagInvalido) {
          this.logger.warn(
            [
              `Ticket ${id}`,
              'Etiquetas inválidas',
              `tags=${JSON.stringify(updateTicketsSoporteDto.tags)}`,
            ].join(' | '),
          );

          throw new BadRequestException(
            'La lista de etiquetas contiene identificadores inválidos.',
          );
        }

        const cleanTagIds = [...new Set(tagIds)].sort((a, b) => a - b);

        // ===============================================
        // VALIDAR EXISTENCIA
        // ===============================================

        if (cleanTagIds.length > 0) {
          const etiquetasExistentes = await tx.etiquetaTicket.findMany({
            where: {
              id: {
                in: cleanTagIds,
              },
            },

            select: {
              id: true,
            },
          });

          const existentesSet = new Set(
            etiquetasExistentes.map((etiqueta) => etiqueta.id),
          );

          const noEncontradas = cleanTagIds.filter(
            (tagId) => !existentesSet.has(tagId),
          );

          if (noEncontradas.length > 0) {
            throw new BadRequestException(
              `Las siguientes etiquetas no existen: ${noEncontradas.join(
                ', ',
              )}`,
            );
          }
        }

        etiquetasResultantes = cleanTagIds;
      }

      // ===================================================
      // PRIMERA ASIGNACIÓN
      // ===================================================

      const tieneAsignacionResultante = usuariosAsignadosDespues.length > 0;

      const fechaPrimeraAsignacion =
        !ticketActual.fechaAsignacion && tieneAsignacionResultante
          ? dayjs().toDate()
          : undefined;

      // ===================================================
      // UPDATE PRINCIPAL
      // ===================================================

      const updatedTicket = await tx.ticketSoporte.update({
        where: {
          id,
        },

        data: {
          titulo: updateTicketsSoporteDto.title,

          descripcion: updateTicketsSoporteDto.description,

          estado: updateTicketsSoporteDto.status,

          prioridad: updateTicketsSoporteDto.priority,

          fijado: updateTicketsSoporteDto.fixed,

          fechaAsignacion: fechaPrimeraAsignacion,

          // =============================================
          // TÉCNICO PRINCIPAL
          // =============================================

          tecnico: tecnicoPrincipalFueEnviado
            ? tecnicoPrincipalSolicitado
              ? {
                  connect: {
                    id: tecnicoPrincipalSolicitado,
                  },
                }
              : {
                  disconnect: true,
                }
            : undefined,

          // =============================================
          // CLIENTE
          // =============================================

          cliente:
            updateTicketsSoporteDto.clienteId !== undefined
              ? updateTicketsSoporteDto.clienteId
                ? {
                    connect: {
                      id: updateTicketsSoporteDto.clienteId,
                    },
                  }
                : {
                    disconnect: true,
                  }
              : undefined,
        },
      });

      // ===================================================
      // PERSISTIR ETIQUETAS
      // ===================================================

      if (updateTicketsSoporteDto.tags !== undefined) {
        /**
         * tags representa el estado final solicitado.
         *
         * Reemplazamos las relaciones actuales.
         */
        await tx.ticketEtiqueta.deleteMany({
          where: {
            ticketId: id,
          },
        });

        if (etiquetasResultantes.length > 0) {
          await tx.ticketEtiqueta.createMany({
            data: etiquetasResultantes.map((etiquetaId) => ({
              ticketId: id,
              etiquetaId,
            })),

            skipDuplicates: true,
          });
        }
      }

      // ===================================================
      // PERSISTIR TÉCNICOS ADICIONALES
      // ===================================================

      if (adicionalesFueronEnviados) {
        /**
         * Se recibió explícitamente la lista completa,
         * así que reemplazamos la colección secundaria.
         */
        await tx.ticketSoporteTecnico.deleteMany({
          where: {
            ticketId: id,
          },
        });

        if (adicionalesResultantes.length > 0) {
          await tx.ticketSoporteTecnico.createMany({
            data: adicionalesResultantes.map((tecnicoId) => ({
              ticketId: id,
              tecnicoId,
            })),

            skipDuplicates: true,
          });
        }
      } else if (tecnicoPrincipalFueEnviado && tecnicoPrincipalResultante) {
        /**
         * Cambió el principal, pero no modificaron
         * explícitamente los adicionales.
         *
         * Si el nuevo principal estaba también como
         * acompañante, quitamos esa duplicidad.
         */
        await tx.ticketSoporteTecnico.deleteMany({
          where: {
            ticketId: id,

            tecnicoId: tecnicoPrincipalResultante,
          },
        });
      }

      // ===================================================
      // CONSTRUIR AUDITORÍA
      // ===================================================

      const cambios: TicketHistorialCambio[] = [];

      // ---------------------------------------------------
      // TÍTULO
      // ---------------------------------------------------

      if (ticketActual.titulo !== updatedTicket.titulo) {
        cambios.push({
          campo: 'titulo',

          anterior: ticketActual.titulo ?? null,

          nuevo: updatedTicket.titulo ?? null,
        });
      }

      // ---------------------------------------------------
      // DESCRIPCIÓN
      // ---------------------------------------------------

      if (ticketActual.descripcion !== updatedTicket.descripcion) {
        cambios.push({
          campo: 'descripcion',

          anterior: ticketActual.descripcion ?? null,

          nuevo: updatedTicket.descripcion ?? null,
        });
      }

      // ---------------------------------------------------
      // ESTADO
      // ---------------------------------------------------

      if (ticketActual.estado !== updatedTicket.estado) {
        cambios.push({
          campo: 'estado',

          anterior: ticketActual.estado,

          nuevo: updatedTicket.estado,
        });
      }

      // ---------------------------------------------------
      // PRIORIDAD
      // ---------------------------------------------------

      if (ticketActual.prioridad !== updatedTicket.prioridad) {
        cambios.push({
          campo: 'prioridad',

          anterior: ticketActual.prioridad,

          nuevo: updatedTicket.prioridad,
        });
      }

      // ---------------------------------------------------
      // CLIENTE
      // ---------------------------------------------------

      if (ticketActual.clienteId !== updatedTicket.clienteId) {
        cambios.push({
          campo: 'cliente',

          anterior: ticketActual.clienteId ?? null,

          nuevo: updatedTicket.clienteId ?? null,
        });
      }

      // ---------------------------------------------------
      // TÉCNICO PRINCIPAL
      // ---------------------------------------------------

      if (ticketActual.tecnicoId !== updatedTicket.tecnicoId) {
        cambios.push({
          campo: 'tecnicoPrincipal',

          anterior: ticketActual.tecnicoId ?? null,

          nuevo: updatedTicket.tecnicoId ?? null,
        });
      }

      // ---------------------------------------------------
      // TÉCNICOS ADICIONALES
      // ---------------------------------------------------

      const adicionalesAntesAuditoria = [...adicionalesAnteriores].sort(
        (a, b) => a - b,
      );

      const adicionalesDespuesAuditoria = [...adicionalesResultantes].sort(
        (a, b) => a - b,
      );

      const adicionalesCambiaron =
        JSON.stringify(adicionalesAntesAuditoria) !==
        JSON.stringify(adicionalesDespuesAuditoria);

      if (adicionalesCambiaron) {
        cambios.push({
          campo: 'tecnicosAdicionales',

          anterior: adicionalesAntesAuditoria,

          nuevo: adicionalesDespuesAuditoria,
        });
      }

      // ---------------------------------------------------
      // ETIQUETAS
      // ---------------------------------------------------

      const etiquetasCambiaron =
        JSON.stringify(etiquetasAnteriores) !==
        JSON.stringify(etiquetasResultantes);

      if (etiquetasCambiaron) {
        cambios.push({
          campo: 'etiquetas',

          anterior: etiquetasAnteriores,

          nuevo: etiquetasResultantes,
        });
      }

      // ---------------------------------------------------
      // FIJADO
      // ---------------------------------------------------

      if (ticketActual.fijado !== updatedTicket.fijado) {
        cambios.push({
          campo: 'fijado',

          anterior: ticketActual.fijado,

          nuevo: updatedTicket.fijado,
        });
      }

      // ===================================================
      // REGISTRAR HISTORIAL
      // ===================================================
      //
      // Importante:
      // no generamos eventos si realmente nada cambió.
      // ===================================================

      if (cambios.length > 0) {
        await this.ticketHistorialTx.registrarActualizacion(tx, {
          ticketId: id,

          actor: actor
            ? {
                usuarioId: actor.id,

                usuarioNombre: actor.nombre,
              }
            : null,

          cambios,
        });
      }

      // ===================================================
      // RESULTADO DE TRANSACCIÓN
      // ===================================================

      return {
        updatedTicket,

        addedUserIds: assignmentChanges.agregados,

        removedUserIds: assignmentChanges.removidos,
      };
    });

    // =======================================================
    // POST-COMMIT REALTIME / PUSH
    // =======================================================
    //
    // Estos efectos ocurren únicamente después de que
    // PostgreSQL haya confirmado la transacción.
    // =======================================================

    await this.handleTicketAssignmentChanges({
      ticket: transactionResult.updatedTicket,

      addedUserIds: transactionResult.addedUserIds,

      removedUserIds: transactionResult.removedUserIds,

      reason: 'REASSIGNED',
    });

    return transactionResult.updatedTicket;
  }

  // ===================== CLOSE =====================
  async closeTickets(id: number, dto: CloseTicketDto) {
    try {
      this.logger.log(`DTO CIERRE DE TICKET:\n${JSON.stringify(dto, null, 2)}`);

      // =====================================================
      // INSTANTE ÚNICO DE CIERRE
      // =====================================================
      //
      // El mismo instante se utiliza para:
      //
      // - cerrar logs técnicos abiertos;
      // - fechaResolucionTecnico, si corresponde;
      // - fechaCierre.
      //
      // =====================================================

      const fechaCierre = dayjs().toDate();

      // =====================================================
      // TRANSACCIÓN PRINCIPAL
      // =====================================================

      const transactionResult = await this.prisma.$transaction(async (tx) => {
        // ===============================================
        // SNAPSHOT DEL TICKET
        // ===============================================

        const ticketActual = await tx.ticketSoporte.findUnique({
          where: {
            id,
          },

          select: {
            id: true,
            empresaId: true,

            titulo: true,
            descripcion: true,

            estado: true,
            prioridad: true,

            fijado: true,

            tecnicoId: true,

            fechaApertura: true,
            fechaCierre: true,
            fechaResolucionTecnico: true,

            tecnico: {
              select: {
                id: true,
                nombre: true,
              },
            },

            asignaciones: {
              select: {
                tecnicoId: true,
              },
            },

            etiquetas: {
              select: {
                etiquetaId: true,
              },
            },

            logsTiempo: {
              select: {
                id: true,
                inicio: true,
                fin: true,
                duracionMinutos: true,
              },
            },

            resumen: {
              select: {
                id: true,
                reabierto: true,
                numeroReaperturas: true,
                intentos: true,
              },
            },
          },
        });

        if (!ticketActual) {
          throw new NotFoundException(`Ticket con id ${id} no encontrado`);
        }

        // ===============================================
        // EVITAR CIERRE DUPLICADO
        // ===============================================

        if (
          ticketActual.estado === EstadoTicketSoporte.RESUELTA ||
          ticketActual.estado === EstadoTicketSoporte.CERRADO
        ) {
          throw new BadRequestException(
            'El ticket ya se encuentra resuelto o cerrado.',
          );
        }

        if (ticketActual.estado === EstadoTicketSoporte.CANCELADA) {
          throw new BadRequestException(
            'No se puede resolver un ticket cancelado.',
          );
        }

        // ===============================================
        // ACTOR
        // ===============================================
        //
        // CloseTicketDto actualmente tiene usuarioId.
        //
        // También soportamos userId como fallback porque
        // UpdateTicketsSoporteDto lo hereda del DTO base.
        //
        // ===============================================

        const actorUsuarioId = dto.usuarioId ?? dto.userId ?? null;

        let actor: {
          id: number;
          nombre: string;
        } | null = null;

        if (actorUsuarioId) {
          actor = await tx.usuario.findUnique({
            where: {
              id: actorUsuarioId,
            },

            select: {
              id: true,
              nombre: true,
            },
          });

          if (!actor) {
            throw new BadRequestException(
              `El usuario actor ${actorUsuarioId} no existe.`,
            );
          }
        }

        // ===============================================
        // ETIQUETAS ANTERIORES
        // ===============================================

        const etiquetasAnteriores = [
          ...new Set(ticketActual.etiquetas.map((item) => item.etiquetaId)),
        ].sort((a, b) => a - b);

        let etiquetasResultantes = [...etiquetasAnteriores];

        // ===============================================
        // VALIDAR ETIQUETAS RESULTANTES
        // ===============================================
        //
        // undefined -> conservar
        // []        -> quitar todas
        // [1, 3]    -> dejar exactamente 1 y 3
        //
        // ===============================================

        if (dto.tags !== undefined) {
          const etiquetaIds = dto.tags.map((tagId) => Number(tagId));

          const tieneEtiquetaInvalida = etiquetaIds.some(
            (etiquetaId) => !Number.isInteger(etiquetaId) || etiquetaId <= 0,
          );

          if (tieneEtiquetaInvalida) {
            this.logger.warn(
              [
                `Ticket ${id}`,
                'Etiquetas inválidas al cerrar ticket',
                `tags=${JSON.stringify(dto.tags)}`,
              ].join(' | '),
            );

            throw new BadRequestException(
              'La lista de etiquetas contiene identificadores inválidos.',
            );
          }

          etiquetasResultantes = [...new Set(etiquetaIds)].sort(
            (a, b) => a - b,
          );

          // =============================================
          // VALIDAR EXISTENCIA
          // =============================================

          if (etiquetasResultantes.length > 0) {
            const existentes = await tx.etiquetaTicket.findMany({
              where: {
                id: {
                  in: etiquetasResultantes,
                },
              },

              select: {
                id: true,
              },
            });

            const existentesSet = new Set(
              existentes.map((etiqueta) => etiqueta.id),
            );

            const noEncontradas = etiquetasResultantes.filter(
              (etiquetaId) => !existentesSet.has(etiquetaId),
            );

            if (noEncontradas.length > 0) {
              throw new BadRequestException(
                `Las siguientes etiquetas no existen: ${noEncontradas.join(
                  ', ',
                )}`,
              );
            }
          }
        }

        // ===============================================
        // FINALIZAR CICLO TÉCNICO
        // ===============================================
        //
        // Sustituimos la llamada externa:
        //
        // this.updateStatusEnRevision(id)
        //
        // porque queremos que:
        //
        // - cierre de logs;
        // - fechaResolucionTecnico;
        // - estado RESUELTA;
        //
        // formen parte de LA MISMA transacción.
        //
        // ===============================================

        const logsAbiertos = ticketActual.logsTiempo.filter(
          (log) => log.fin === null,
        );

        const tieneCicloTecnicoPorFinalizar =
          ticketActual.estado === EstadoTicketSoporte.EN_PROCESO ||
          logsAbiertos.length > 0;

        const duracionesLogsAbiertos = new Map<number, number>();

        for (const log of logsAbiertos) {
          const minutosReales = dayjs(fechaCierre).diff(
            dayjs(log.inicio),
            'minutes',
          );

          /**
           * Conservamos la misma regla que ya utilizaba
           * updateStatusEnRevision:
           *
           * un ciclo iniciado cuenta como mínimo 1 minuto.
           */
          const duracionMinutos = minutosReales > 0 ? minutosReales : 1;

          duracionesLogsAbiertos.set(log.id, duracionMinutos);

          await tx.ticketTimeLog.update({
            where: {
              id: log.id,
            },

            data: {
              fin: fechaCierre,
              duracionMinutos,
            },
          });
        }

        // ===============================================
        // TIEMPO TÉCNICO
        // ===============================================
        //
        // Calculamos desde el mismo snapshot de logs.
        //
        // Para logs que estaban abiertos utilizamos
        // el valor recién calculado.
        //
        // ===============================================

        const tiempoTecnicoMinutos = ticketActual.logsTiempo.reduce(
          (total, log) => {
            if (log.fin === null) {
              return total + (duracionesLogsAbiertos.get(log.id) ?? 0);
            }

            return total + (log.duracionMinutos ?? 0);
          },
          0,
        );

        // ===============================================
        // TIEMPO TOTAL
        // ===============================================

        const tiempoTotalMinutos = Math.max(
          dayjs(fechaCierre).diff(dayjs(ticketActual.fechaApertura), 'minutes'),
          0,
        );

        // ===============================================
        // CERRAR TICKET
        // ===============================================

        const ticketClosed = await tx.ticketSoporte.update({
          where: {
            id,
          },

          data: {
            titulo: dto.title,

            descripcion: dto.description,

            prioridad: dto.priority,

            estado: EstadoTicketSoporte.RESUELTA,

            fijado: false,

            fechaCierre,

            /**
             * Solamente generamos resolución técnica
             * cuando realmente existió un ciclo
             * técnico que finalizar.
             *
             * Si ya existía una fecha histórica,
             * la conservamos.
             */
            fechaResolucionTecnico: tieneCicloTecnicoPorFinalizar
              ? (ticketActual.fechaResolucionTecnico ?? fechaCierre)
              : undefined,
          },
        });

        // ===============================================
        // SINCRONIZAR ETIQUETAS
        // ===============================================

        if (dto.tags !== undefined) {
          await tx.ticketEtiqueta.deleteMany({
            where: {
              ticketId: id,
            },
          });

          if (etiquetasResultantes.length > 0) {
            await tx.ticketEtiqueta.createMany({
              data: etiquetasResultantes.map((etiquetaId) => ({
                ticketId: id,
                etiquetaId,
              })),

              skipDuplicates: true,
            });
          }
        }

        // ===============================================
        // RESUMEN HISTÓRICO
        // ===============================================
        //
        // Antes se llamaba:
        //
        // this.ticketResumen.create(...)
        //
        // Eso utiliza otro PrismaService fuera de esta
        // transacción.
        //
        // Ahora lo persistimos con el mismo tx.
        //
        // Además soportamos un TicketResumen existente,
        // útil para tickets que fueron reabiertos.
        //
        // ===============================================

        const resumenExistente = await tx.ticketResumen.findUnique({
          where: {
            ticketId: id,
          },

          select: {
            id: true,
            numeroReaperturas: true,
            intentos: true,
          },
        });

        if (resumenExistente) {
          await tx.ticketResumen.update({
            where: {
              id: resumenExistente.id,
            },

            data: {
              solucionId: dto.solucionId ?? null,

              resueltoComo: dto.resueltoComo?.trim() || null,

              notasInternas: dto.notasInternas?.trim() || null,

              reabierto: false,

              /**
               * No reiniciamos:
               *
               * - numeroReaperturas
               * - intentos
               *
               * porque contienen historia previa.
               */

              tiempoTotalMinutos,

              tiempoTecnicoMinutos,
            },
          });
        } else {
          await tx.ticketResumen.create({
            data: {
              ticketId: id,

              solucionId: dto.solucionId ?? null,

              resueltoComo: dto.resueltoComo?.trim() || null,

              notasInternas: dto.notasInternas?.trim() || null,

              reabierto: false,

              numeroReaperturas: 0,

              /**
               * TicketResumen.create() utiliza
               * intentos = 1 como valor inicial.
               * Conservamos esa misma semántica.
               */
              intentos: 1,

              tiempoTotalMinutos,

              tiempoTecnicoMinutos,
            },
          });
        }

        // ===============================================
        // AUDITORÍA
        // ===============================================

        const cambios: TicketHistorialCambio[] = [];

        // -----------------------------------------------
        // TÍTULO
        // -----------------------------------------------

        if (ticketActual.titulo !== ticketClosed.titulo) {
          cambios.push({
            campo: 'titulo',

            anterior: ticketActual.titulo ?? null,

            nuevo: ticketClosed.titulo ?? null,
          });
        }

        // -----------------------------------------------
        // DESCRIPCIÓN
        // -----------------------------------------------

        if (ticketActual.descripcion !== ticketClosed.descripcion) {
          cambios.push({
            campo: 'descripcion',

            anterior: ticketActual.descripcion ?? null,

            nuevo: ticketClosed.descripcion ?? null,
          });
        }

        // -----------------------------------------------
        // ESTADO
        // -----------------------------------------------

        if (ticketActual.estado !== ticketClosed.estado) {
          cambios.push({
            campo: 'estado',

            anterior: ticketActual.estado,

            nuevo: ticketClosed.estado,
          });
        }

        // -----------------------------------------------
        // PRIORIDAD
        // -----------------------------------------------

        if (ticketActual.prioridad !== ticketClosed.prioridad) {
          cambios.push({
            campo: 'prioridad',

            anterior: ticketActual.prioridad,

            nuevo: ticketClosed.prioridad,
          });
        }

        // -----------------------------------------------
        // FIJADO
        // -----------------------------------------------

        if (ticketActual.fijado !== ticketClosed.fijado) {
          cambios.push({
            campo: 'fijado',

            anterior: ticketActual.fijado,

            nuevo: ticketClosed.fijado,
          });
        }

        // -----------------------------------------------
        // ETIQUETAS
        // -----------------------------------------------

        const etiquetasCambiaron =
          JSON.stringify(etiquetasAnteriores) !==
          JSON.stringify(etiquetasResultantes);

        if (etiquetasCambiaron) {
          cambios.push({
            campo: 'etiquetas',

            anterior: etiquetasAnteriores,

            nuevo: etiquetasResultantes,
          });
        }

        // ===============================================
        // PERSISTIR AUDITORÍA
        // ===============================================

        if (cambios.length > 0) {
          await this.ticketHistorialTx.registrarActualizacion(tx, {
            ticketId: id,

            actor: actor
              ? {
                  usuarioId: actor.id,

                  usuarioNombre: actor.nombre,
                }
              : null,

            cambios,
          });
        }

        // ===============================================
        // PARTICIPANTES PARA METAS
        // ===============================================

        const tecnicoIds = [
          ...new Set(
            [
              ticketActual.tecnicoId,

              ...ticketActual.asignaciones.map(
                (asignacion) => asignacion.tecnicoId,
              ),
            ].filter(
              (tecnicoId): tecnicoId is number =>
                typeof tecnicoId === 'number' && tecnicoId > 0,
            ),
          ),
        ];

        return {
          ticketClosed,

          tecnicoIds,

          tecnicoNombre: ticketActual.tecnico?.nombre ?? null,

          tiempoTecnicoMinutos,

          tiempoTotalMinutos,
        };
      });

      // =====================================================
      // POST-COMMIT: METAS
      // =====================================================
      //
      // Las metas pertenecen a otro servicio/recurso y
      // actualmente no aceptan Prisma.TransactionClient.
      //
      // Por eso se procesan después del COMMIT.
      //
      // Un fallo de una meta NO debe convertir un ticket
      // correctamente cerrado en un cierre fallido.
      //
      // =====================================================

      const resultadosMetas = await Promise.allSettled(
        transactionResult.tecnicoIds.map((tecnicoId) =>
          this.metasTicketSoporte.incrementMeta(tecnicoId),
        ),
      );

      const metasFallidas = resultadosMetas.filter(
        (resultado) => resultado.status === 'rejected',
      );

      if (metasFallidas.length > 0) {
        this.logger.warn(
          [
            'Ticket cerrado, pero una o más metas no pudieron actualizarse',
            `ticketId=${id}`,
            `fallidas=${metasFallidas.length}`,
          ].join(' | '),
        );
      }

      // =====================================================
      // POST-COMMIT: WEBSOCKET
      // =====================================================
      //
      // El flujo anterior podía emitir PENDIENTE_REVISION
      // al llamar updateStatusEnRevision(), pero no siempre
      // emitía el estado final RESUELTA.
      //
      // Ahora emitimos únicamente el estado persistido.
      //
      // =====================================================

      try {
        await this.ws.sendTicketSuportChangeStatus({
          empresaId: transactionResult.ticketClosed.empresaId,

          ticketId: transactionResult.ticketClosed.id,

          nuevoEstado: transactionResult.ticketClosed.estado,

          titulo: transactionResult.ticketClosed.titulo,

          tecnico: transactionResult.tecnicoNombre,
        });
      } catch (error) {
        this.logger.warn(
          [
            'Ticket cerrado correctamente, pero falló la notificación WebSocket',
            `ticketId=${id}`,
            `error=${error instanceof Error ? error.message : String(error)}`,
          ].join(' | '),
        );
      }

      this.logger.log(
        [
          'Ticket cerrado correctamente',
          `ticketId=${id}`,
          `estado=${transactionResult.ticketClosed.estado}`,
          `tiempoTecnico=${transactionResult.tiempoTecnicoMinutos}min`,
          `tiempoTotal=${transactionResult.tiempoTotalMinutos}min`,
        ].join(' | '),
      );

      return {
        message: 'Ticket cerrado con éxito',

        ticket: transactionResult.ticketClosed,
      };
    } catch (error) {
      this.logger.error('Error al cerrar ticket: ', error);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('No se pudo cerrar el ticket');
    }
  }

  // ===================== DELETE =====================
  async delete(ticketId: number) {
    return await this.prisma.$transaction(async (tx) => {
      const ticketCancelado = await tx.ticketSoporte.update({
        where: {
          id: ticketId,
        },

        data: {
          estado: EstadoTicketSoporte.CANCELADA,
        },
      });

      this.logger.debug(
        `Ticket ${ticketId} marcado como CANCELADA`,
        ticketCancelado,
      );

      return ticketCancelado;
    });
  }

  async removeAll() {
    try {
      const ticketToDelete = await this.prisma.ticketSoporte.deleteMany({});
      return ticketToDelete;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('No se pudieron eliminar tickets');
    }
  }

  // ===================== STATUS (DOMINIO + WS) =====================
  async updateStatusEnProceso(
    ticketId: number,
  ): Promise<{ id: number; estado: string }> {
    const ticket = await this.ticketsRepo.findById(ticketId);

    if (!ticket) {
      throw new NotFoundException(`Ticket con id ${ticketId} no encontrado`);
    }

    if (!ticket.tecnicoId) {
      throw new BadRequestException(
        "No se puede poner 'En Proceso' un ticket sin técnico asignado.",
      );
    }

    const ahora = dayjs().toDate();

    /*
     * La misma fecha representa tanto la transición
     * de dominio como el inicio del ciclo técnico.
     */
    ticket.marcarEnProceso(ahora);

    const updated = await this.ticketsRepo.update(ticket);

    const logAbierto = await this.prisma.ticketTimeLog.findFirst({
      where: {
        ticketId,
        fin: null,
      },
    });

    if (!logAbierto) {
      await this.prisma.ticketTimeLog.create({
        data: {
          ticketId,
          tecnicoId: updated.tecnicoId!,
          inicio: ahora,
        },
      });
    }

    const tecnicoNombre = updated.tecnicoId
      ? (
          await this.prisma.usuario.findUnique({
            where: {
              id: updated.tecnicoId,
            },

            select: {
              nombre: true,
            },
          })
        )?.nombre
      : null;

    const dtoWs = {
      empresaId: updated.empresaId,
      ticketId: updated.id!,
      nuevoEstado: updated.estado,
      titulo: updated.titulo,
      tecnico: tecnicoNombre,
    };

    await this.ws.sendTicketSuportChangeStatus(dtoWs);

    return {
      id: updated.id!,
      estado: updated.estado,
    };
  }

  async updateStatusEnRevision(
    ticketId: number,
  ): Promise<{ id: number; estado: string }> {
    const ticket = await this.ticketsRepo.findById(ticketId);

    if (!ticket) {
      throw new NotFoundException(`Ticket con id ${ticketId} no encontrado`);
    }

    const ahora = dayjs().toDate();

    /*
     * El mismo instante cierra el ciclo técnico
     * y registra la resolución técnica.
     */
    ticket.marcarEnRevision(ahora);

    const updated = await this.ticketsRepo.update(ticket);

    const logAbierto = await this.prisma.ticketTimeLog.findFirst({
      where: {
        ticketId,
        fin: null,
      },
    });

    if (logAbierto) {
      const inicioDayjs = dayjs(logAbierto.inicio);
      const ahoraDayjs = dayjs(ahora);

      const minutosReales = ahoraDayjs.diff(inicioDayjs, 'minutes');

      await this.prisma.ticketTimeLog.update({
        where: {
          id: logAbierto.id,
        },

        data: {
          fin: ahora,

          duracionMinutos: minutosReales > 0 ? minutosReales : 1,
        },
      });
    }

    const tecnicoNombre = updated.tecnicoId
      ? (
          await this.prisma.usuario.findUnique({
            where: {
              id: updated.tecnicoId,
            },

            select: {
              nombre: true,
            },
          })
        )?.nombre
      : null;

    const dtoWs = {
      empresaId: updated.empresaId,
      ticketId: updated.id!,
      nuevoEstado: updated.estado,
      titulo: updated.titulo,
      tecnico: tecnicoNombre,
    };

    await this.ws.sendTicketSuportChangeStatus(dtoWs);

    return {
      id: updated.id!,
      estado: updated.estado,
    };
  }

  private async emitTicketAssignmentPush(params: {
    userId: number;

    ticket: {
      id: number;
      titulo: string | null;
      estado: string;
      prioridad: string;
    };

    change: 'ASSIGNED' | 'UNASSIGNED';

    reason: 'CREATED' | 'REASSIGNED';
  }): Promise<void> {
    const { userId, ticket, change, reason } = params;

    try {
      const assigned = change === 'ASSIGNED';

      const result = await this.firebasePush.sendToUser({
        usuarioId: userId,

        title: assigned
          ? 'Nuevo ticket asignado'
          : 'Asignación de ticket retirada',

        body: assigned
          ? `Ticket #${ticket.id} · ${ticket.titulo ?? 'Sin título'}`
          : `El ticket #${ticket.id} ya no está asignado a ti.`,

        /*
         * Todo FCM data debe ser string.
         */
        data: {
          type: 'ticket.assignment',

          ticketId: String(ticket.id),

          change,

          reason,

          status: String(ticket.estado),

          priority: String(ticket.prioridad),
        },

        channelId: 'tickets',

        /*
         * Si existen varios pushes pendientes del mismo
         * ticket, Android puede colapsar el estado viejo.
         */
        collapseKey: `ticket-assignment-${ticket.id}`,

        /*
         * 6 horas.
         * Una asignación vieja no debe aparecer días después.
         */
        ttlMs: 6 * 60 * 60 * 1000,
      });

      this.logger.log(
        [
          'Ticket assignment push procesado',
          `ticketId=${ticket.id}`,
          `userId=${userId}`,
          `change=${change}`,
          `reason=${reason}`,
          `targets=${result.targets}`,
          `success=${result.successCount}`,
          `failed=${result.failureCount}`,
          `skipped=${result.skipped}`,
          `skipReason=${result.reason ?? 'none'}`,
        ].join(' | '),
      );
    } catch (error) {
      /*
       * CRÍTICO:
       *
       * La asignación del ticket ya está persistida.
       * Un fallo en Firebase jamás debe convertir una
       * asignación válida en error HTTP.
       */
      this.logger.error(
        [
          'No fue posible emitir push de asignación',
          `ticketId=${ticket.id}`,
          `userId=${userId}`,
          `change=${change}`,
        ].join(' | '),

        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
