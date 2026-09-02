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

    if (this.estadosConFlujoDedicado.has(estadoSolicitado)) {
      throw new BadRequestException(
        `El cambio de estado ${estadoActual} → ${estadoSolicitado} debe realizarse mediante su flujo dedicado.`,
      );
    }
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
   * Efecto secundario posterior al COMMIT.
   *
   * Nunca debe ejecutarse dentro de una transacción Prisma.
   *
   * De esta forma:
   *
   * 1. la DB confirma el cambio;
   * 2. Socket.IO informa del cambio;
   * 3. el cliente puede consultar inmediatamente por HTTP
   *    y observar el nuevo estado.
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

    /*
     * Los tickets históricos permiten empresaId nullable.
     *
     * Para eventos operativos del CRM exigimos contexto
     * empresarial válido antes de propagarlos.
     */
    if (!params.ticket.empresaId || params.ticket.empresaId <= 0) {
      this.logger.warn(
        [
          'Cambio de asignación sin evento realtime',
          `ticketId=${params.ticket.id}`,
          'motivo=empresaId ausente',
        ].join(' | '),
      );

      return;
    }

    const occurredAt = new Date().toISOString();

    /*
     * Podemos emitir ambas ramas concurrentemente.
     *
     * WebSocketServices ya aísla sus errores para impedir
     * que una falla Socket.IO afecte una operación de ticket
     * que ya fue persistida correctamente.
     */
    await Promise.all([
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
    ]);

    this.logger.log(
      [
        'Cambios de asignación procesados',
        `ticketId=${params.ticket.id}`,
        `added=[${addedUserIds.join(',')}]`,
        `removed=[${removedUserIds.join(',')}]`,
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
      const baseWhere: Prisma.TicketSoporteWhereInput = (() => {
        switch (query.vista) {
          case 'lista':
            return {
              estado: {
                in: [EstadoTicketSoporte.RESUELTA, EstadoTicketSoporte.CERRADO],
              },
            };

          case 'enProceso':
            return {
              estado: {
                in: [
                  EstadoTicketSoporte.EN_PROCESO,
                  EstadoTicketSoporte.PENDIENTE,
                  EstadoTicketSoporte.PENDIENTE_CLIENTE,
                  EstadoTicketSoporte.PENDIENTE_TECNICO,
                  EstadoTicketSoporte.PENDIENTE_REVISION,
                ],
              },
            };

          case 'archivados':
            return {
              estado: {
                in: [
                  EstadoTicketSoporte.ARCHIVADA,
                  EstadoTicketSoporte.CANCELADA,
                ],
              },
            };

          case 'inbox':
          default:
            return {
              estado: {
                notIn: [
                  EstadoTicketSoporte.RESUELTA,
                  EstadoTicketSoporte.CERRADO,
                  EstadoTicketSoporte.ARCHIVADA,
                  EstadoTicketSoporte.CANCELADA,
                ],
              },
            };
        }
      })();

      const searchID = Number(query.search);

      // =====================================================
      // FILTROS QUE NECESITAN OR
      //
      // Los dejamos dentro de AND para poder combinar:
      // - búsqueda
      // - técnico principal/adicional
      // sin que un OR reemplace al otro.
      // =====================================================

      const andFilters: Prisma.TicketSoporteWhereInput[] = [];

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

      const where: Prisma.TicketSoporteWhereInput = {
        ...baseWhere,

        ...(query.creadosPor && {
          creadoPorId: query.creadosPor,
        }),

        ...(query.sector && {
          cliente: {
            sectorId: {
              equals: query.sector,
            },
          },
        }),

        ...(query.tags?.length && {
          etiquetas: {
            some: {
              etiquetaId: {
                in: query.tags,
              },
            },
          },
        }),

        ...(query.fechaInicio &&
          query.fechaFin && {
            fechaApertura: {
              gte: new Date(query.fechaInicio),
              lte: new Date(query.fechaFin),
            },
          }),

        ...(andFilters.length > 0 && {
          AND: andFilters,
        }),
      };

      this.logger.log(`Where:\n${JSON.stringify(query, null, 2)}`);

      const page = query.page ?? 1;
      const limit = query.limit ?? 10;

      const [
        tickets,
        counts,
        ticketsDisponibles,
        ticketEnProceso,
        ticketsResueltos,
      ] = await Promise.all([
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

            tecnico: {
              select: {
                id: true,
                nombre: true,
              },
            },

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

            creadoPor: {
              select: {
                id: true,
                nombre: true,
                rol: true,
              },
            },

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

        this.prisma.ticketSoporte.count({
          where,
        }),

        this.prisma.ticketSoporte.count({
          where: {
            estado: {
              notIn: [
                EstadoTicketSoporte.CERRADO,
                EstadoTicketSoporte.CANCELADA,
                EstadoTicketSoporte.RESUELTA,
              ],
            },
          },
        }),

        this.prisma.ticketSoporte.count({
          where: {
            estado: EstadoTicketSoporte.EN_PROCESO,
          },
        }),

        this.prisma.ticketSoporte.count({
          where: {
            estado: EstadoTicketSoporte.RESUELTA,
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
          // Evitar mostrar al principal también como acompañante.
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
        //
        // Logs cerrados:
        //   duracionMinutos
        //
        // Log actualmente abierto:
        //   inicio -> ahora
        //
        // Esto permite que el valor mostrado sea realmente
        // "live" mientras el ticket está EN_PROCESO.
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

        /*
         * Una vez cerrado, TicketResumen es la fuente
         * histórica consolidada.
         *
         * Mientras siga abierto, calculamos desde logs.
         */
        const tiempoTecnicoDisplay =
          ticket.resumen?.tiempoTecnicoMinutos ?? tiempoTecnicoLive;

        const tiempoTotalDisplay = ticket.resumen?.tiempoTotalMinutos ?? null;

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
            /*
             * Tiempo realmente trabajado según
             * TicketTimeLog.
             */
            timeSpentMinutes: tiempoTecnicoDisplay,

            /*
             * Duración calendario apertura -> cierre.
             *
             * Sólo existe como consolidado cuando
             * el ticket fue cerrado.
             */
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

      const total = counts;
      const totalPages = Math.ceil(total / limit);

      return {
        data: ticketsFormateados,

        ticketsData: {
          ticketsDisponibles,
          ticketEnProceso,
          ticketsResueltos,
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
      `UpdateTicketsSoporteDto: \n${JSON.stringify(
        updateTicketsSoporteDto,
        null,
        2,
      )}`,
    );

    /*
     * =======================================================
     * TRANSACTION
     * =======================================================
     *
     * Aquí únicamente hacemos trabajo persistente.
     *
     * Socket.IO se ejecutará después del COMMIT.
     * =======================================================
     */

    const transactionResult = await this.prisma.$transaction(async (tx) => {
      const ticketActual = await tx.ticketSoporte.findUnique({
        where: {
          id,
        },

        select: {
          id: true,

          estado: true,

          tecnicoId: true,

          clienteId: true,

          fechaAsignacion: true,

          /*
           * Necesitamos conocer los IDs, no solamente
           * cuántas asignaciones existen.
           */
          asignaciones: {
            select: {
              tecnicoId: true,
            },
          },
        },
      });

      if (!ticketActual) {
        throw new NotFoundException(`Ticket con id ${id} no encontrado`);
      }

      // ===================================================
      // ESTADO
      // ===================================================

      this.validarCambioEstadoGeneral(
        ticketActual.estado,
        updateTicketsSoporteDto.status,
      );

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
      // USUARIO PRINCIPAL RESULTANTE
      // ===================================================
      //
      // Compatibilidad:
      //
      // tecnicoId
      // assignee
      //
      // Si ninguno fue enviado, conservamos el actual.
      // ===================================================

      const tecnicoPrincipalFueEnviado =
        updateTicketsSoporteDto.tecnicoId !== undefined ||
        updateTicketsSoporteDto.assignee !== undefined;

      const tecnicoPrincipalId =
        updateTicketsSoporteDto.tecnicoId ??
        updateTicketsSoporteDto.assignee?.id ??
        null;

      const tecnicoPrincipalResultante = tecnicoPrincipalFueEnviado
        ? tecnicoPrincipalId
        : ticketActual.tecnicoId;

      // ===================================================
      // USUARIOS ADICIONALES RESULTANTES
      // ===================================================
      //
      // Compatibilidad:
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

      /*
       * Si no enviaron compañeros, conservamos los
       * anteriores.
       *
       * Sin embargo quitamos al nuevo principal de la
       * colección secundaria para mantener el invariante:
       *
       * un usuario no puede ser principal y adicional
       * simultáneamente.
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
      // PRIMERA ASIGNACIÓN
      // ===================================================
      //
      // fechaAsignacion conserva semántica histórica:
      //
      // primera vez en la vida del ticket que tuvo
      // cualquier usuario asignado.
      // ===================================================

      const tieneTecnicoResultante = usuariosAsignadosDespues.length > 0;

      const fechaPrimeraAsignacion =
        !ticketActual.fechaAsignacion && tieneTecnicoResultante
          ? dayjs().toDate()
          : undefined;

      // ===================================================
      // UPDATE PRINCIPAL DEL TICKET
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

          tecnico: tecnicoPrincipalFueEnviado
            ? tecnicoPrincipalId
              ? {
                  connect: {
                    id: tecnicoPrincipalId,
                  },
                }
              : {
                  disconnect: true,
                }
            : undefined,

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
      // ETIQUETAS
      // ===================================================

      if (updateTicketsSoporteDto.tags !== undefined) {
        const tagIds = updateTicketsSoporteDto.tags.map((tag) =>
          Number(tag.value),
        );

        const tieneTagInvalido = tagIds.some(
          (tagId) => !Number.isInteger(tagId) || tagId <= 0,
        );

        if (tieneTagInvalido) {
          throw new BadRequestException(
            'La lista de etiquetas contiene identificadores inválidos.',
          );
        }

        const cleanTagIds = [...new Set(tagIds)];

        await tx.ticketEtiqueta.deleteMany({
          where: {
            ticketId: id,
          },
        });

        if (cleanTagIds.length > 0) {
          await tx.ticketEtiqueta.createMany({
            data: cleanTagIds.map((etiquetaId) => ({
              ticketId: id,
              etiquetaId,
            })),

            skipDuplicates: true,
          });
        }
      }

      // ===================================================
      // USUARIOS ADICIONALES
      // ===================================================

      if (adicionalesFueronEnviados) {
        /*
         * Lista explícitamente enviada:
         *
         * reemplazamos la colección completa.
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
        /*
         * No modificaron explícitamente compañeros,
         * pero sí cambiaron el principal.
         *
         * Si el nuevo principal anteriormente estaba
         * como acompañante, eliminamos únicamente esa
         * relación duplicada.
         *
         * Los demás acompañantes permanecen intactos.
         */

        await tx.ticketSoporteTecnico.deleteMany({
          where: {
            ticketId: id,

            tecnicoId: tecnicoPrincipalResultante,
          },
        });
      }

      /*
       * No emitimos todavía.
       *
       * Estos datos salen de la transacción y se utilizan
       * únicamente cuando Prisma haya completado COMMIT.
       */
      return {
        updatedTicket,

        addedUserIds: assignmentChanges.agregados,

        removedUserIds: assignmentChanges.removidos,
      };
    });

    // =======================================================
    // POST-COMMIT REALTIME
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
      const ticketToClose = await this.prisma.ticketSoporte.findUnique({
        where: {
          id,
        },
      });

      this.logger.log(`DTO CIERRE DE TICKET:\n${JSON.stringify(dto, null, 2)}`);

      if (!ticketToClose) {
        throw new NotFoundException('Ticket no encontrado');
      }

      // =====================================================
      // FINALIZAR CICLO TÉCNICO, SI EXISTE
      //
      // El ticket puede cerrarse directamente por motivos
      // administrativos/incidentes sin haber pasado por
      // atención técnica.
      //
      // En ese caso NO debemos fabricar una
      // fechaResolucionTecnico.
      // =====================================================

      const logTecnicoAbierto = await this.prisma.ticketTimeLog.findFirst({
        where: {
          ticketId: id,
          fin: null,
        },
        select: {
          id: true,
        },
      });

      const tieneCicloTecnicoPorFinalizar =
        ticketToClose.estado === EstadoTicketSoporte.EN_PROCESO ||
        Boolean(logTecnicoAbierto);

      if (tieneCicloTecnicoPorFinalizar) {
        await this.updateStatusEnRevision(id);
      }

      // =====================================================
      // INSTANTE ÚNICO DE CIERRE
      // =====================================================

      const fechaCierre = dayjs().toDate();

      // =====================================================
      // TIEMPO TÉCNICO
      //
      // Suma únicamente TicketTimeLog.
      // Si nunca hubo trabajo técnico, será 0.
      // =====================================================

      const tiempoTecnicoMinutos =
        await this.ticketsRepo.obtenerTiempoTecnicoTrabajado(id);

      // =====================================================
      // TIEMPO TOTAL
      //
      // Tiempo calendario:
      // fechaApertura -> fechaCierre
      // =====================================================

      const tiempoTotalMinutos = Math.max(
        dayjs(fechaCierre).diff(dayjs(ticketToClose.fechaApertura), 'minutes'),
        0,
      );

      const dtoSolucion: CreateTicketResumenDto = {
        ticketId: id,
        notasInternas: dto.notasInternas,
        resueltoComo: dto.resueltoComo,
        solucionId: dto.solucionId,
        tiempoTotalMinutos,
        tiempoTecnicoMinutos,
      };

      // =====================================================
      // ETIQUETAS
      //
      // Sólo sincronizamos si realmente vienen en el DTO.
      //
      // Si no vienen, conservamos las existentes.
      // Si viene [], significa quitar todas.
      // =====================================================

      if (dto.tags !== undefined) {
        const etiquetaIds = dto.tags.map((tag) => Number(tag.value));

        const tieneEtiquetaInvalida = etiquetaIds.some(
          (etiquetaId) => !Number.isInteger(etiquetaId) || etiquetaId <= 0,
        );

        if (tieneEtiquetaInvalida) {
          throw new BadRequestException(
            'La lista de etiquetas contiene identificadores inválidos.',
          );
        }

        const etiquetaIdsUnicos = [...new Set(etiquetaIds)];

        await this.prisma.ticketEtiqueta.deleteMany({
          where: {
            ticketId: id,
          },
        });

        if (etiquetaIdsUnicos.length > 0) {
          await this.prisma.ticketEtiqueta.createMany({
            data: etiquetaIdsUnicos.map((etiquetaId) => ({
              ticketId: id,
              etiquetaId,
            })),
            skipDuplicates: true,
          });
        }
      }

      // =====================================================
      // CERRAR TICKET
      //
      // No reasignamos técnico durante el cierre.
      // La asignación debe haberse realizado previamente
      // mediante el flujo de actualización.
      // =====================================================

      const ticketClosed = await this.prisma.ticketSoporte.update({
        where: {
          id,
        },

        data: {
          titulo: dto.title,
          descripcion: dto.description,

          estado: EstadoTicketSoporte.RESUELTA,
          prioridad: dto.priority,

          fechaCierre,

          fijado: false,
        },
      });

      // =====================================================
      // METAS
      //
      // Participantes únicos:
      // principal + adicionales.
      //
      // Esto también protege datos históricos donde el
      // principal pudiera estar repetido en asignaciones.
      // =====================================================

      const participantes = await this.prisma.ticketSoporte.findUnique({
        where: {
          id: ticketClosed.id,
        },

        select: {
          tecnicoId: true,

          asignaciones: {
            select: {
              tecnicoId: true,
            },
          },
        },
      });

      const tecnicoIds = new Set<number>();

      if (participantes?.tecnicoId) {
        tecnicoIds.add(participantes.tecnicoId);
      }

      for (const asignacion of participantes?.asignaciones ?? []) {
        tecnicoIds.add(asignacion.tecnicoId);
      }

      for (const tecnicoId of tecnicoIds) {
        await this.metasTicketSoporte.incrementMeta(tecnicoId);
      }

      // =====================================================
      // RESUMEN HISTÓRICO
      // =====================================================

      await this.ticketResumen.create(dtoSolucion);

      return {
        message: 'Ticket cerrado con éxito',
        ticket: ticketClosed,
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
      const deletedTicket = await tx.ticketSoporte.delete({
        where: {
          id: ticketId,
        },
      });
      this.logger.debug('El ticket eliminado es: ', deletedTicket);
      return deletedTicket;
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
}
