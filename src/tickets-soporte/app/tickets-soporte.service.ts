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
import { EstadoTicketSoporte } from '@prisma/client';
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
// import { dayjs } from '';

@Injectable()
export class TicketsSoporteService {
  private readonly logger = new Logger(TicketsSoporteService.name);

  constructor(
    @Inject(TICKET_SOPORTE_REPOSITORY)
    private readonly ticketsRepo: TicketSoporteRepository,
    private readonly prisma: PrismaService,
    private readonly twilioMessageSuport: GenerarMensajeSoporteService,
    private readonly metasTicketSoporte: MetasTicketsService,
    private readonly ws: WebSocketServices,

    private readonly configService: ConfigService,

    private readonly cloudApi: CloudApiMetaService,
    private readonly ticketResumen: TicketResumenService,
  ) {}

  // ===================== CREATE =====================
  async create(createTicketsSoporteDto: CreateTicketsSoporteDto) {
    this.logger.debug('La data del ticket soporte: ', createTicketsSoporteDto);

    return await this.prisma.$transaction(async (tx) => {
      const newTicketSoporte = await tx.ticketSoporte.create({
        data: {
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

          // RELACIONES ONE-TO-MANY (Tablas intermedias)

          asignaciones:
            createTicketsSoporteDto.tecnicosAdicionales?.length > 0
              ? {
                  create: createTicketsSoporteDto.tecnicosAdicionales.map(
                    (tecnicoId) => ({ tecnicoId }),
                  ),
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
        where: { id: ticketId },
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
        },
      });

      if (!ticketInfo) {
        throw new NotFoundException('Ticket no encontrado');
      }

      const boletaData = {
        ticketId: ticketInfo.id,
        // Manejo de título y descripción nulos
        titulo: ticketInfo.titulo ?? 'Sin título',
        descripcion: ticketInfo.descripcion ?? 'Sin descripción',
        estado: ticketInfo.estado,
        prioridad: ticketInfo.prioridad,
        fechaApertura: ticketInfo.fechaApertura,
        fechaCierre: ticketInfo.fechaCierre ?? null,

        // Manejo de cliente nulo
        cliente: ticketInfo.cliente
          ? {
              id: ticketInfo.cliente.id,
              nombreCompleto:
                `${ticketInfo.cliente.nombre ?? ''} ${ticketInfo.cliente.apellidos ?? ''}`.trim() ||
                'Cliente sin nombre',
              telefono: ticketInfo.cliente.telefono ?? 'N/A',
              direccion: ticketInfo.cliente.direccion ?? 'N/A',
            }
          : null,

        // El técnico ya tiene manejo de nulos, se mantiene consistente
        tecnico: ticketInfo.tecnico
          ? {
              id: ticketInfo.tecnico.id,
              nombre: ticketInfo.tecnico.nombre,
            }
          : null,

        // Manejo preventivo para empresa (aunque usualmente es obligatoria)
        empresa: {
          id: ticketInfo.empresa?.id,
          nombre: ticketInfo.empresa?.nombre ?? 'Empresa no asignada',
          direccion: ticketInfo.empresa?.direccion ?? 'N/A',
          correo: ticketInfo.empresa?.correo ?? 'N/A',
          telefono: ticketInfo.empresa?.telefono ?? 'N/A',
          pbx: ticketInfo.empresa?.pbx ?? 'N/A',
        },

        fechaGeneracionBoleta: new Date().toISOString(),
      };

      return boletaData;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error('Error al generar boleta de ticket:', error);
      throw new InternalServerErrorException('Error al generar boleta');
    }
  }

  // Obtener todos los tickets con sus detalles y comentarios
  async getTickets() {
    try {
      const tickets = await this.prisma.ticketSoporte.findMany({
        orderBy: {
          fechaApertura: 'desc',
        },
        select: {
          id: true,
          titulo: true,
          descripcion: true,
          estado: true,
          prioridad: true,
          fijado: true,
          // --- 1. DATOS DE RELACIONES (Usuarios) ---
          tecnico: {
            select: { id: true, nombre: true },
          },
          asignaciones: {
            select: {
              tecnico: { select: { id: true, nombre: true, rol: true } },
            },
          },
          creadoPor: {
            select: { id: true, nombre: true, rol: true },
          },
          cliente: {
            select: { id: true, nombre: true, apellidos: true },
          },

          // --- 2. FECHAS CLAVE ---
          fechaApertura: true,
          fechaCierre: true,

          // --- 3. METADATA ---
          etiquetas: {
            select: {
              etiqueta: { select: { nombre: true, id: true } },
            },
          },
          SeguimientoTicket: {
            select: {
              descripcion: true,
              fechaRegistro: true,
              usuario: { select: { id: true, nombre: true } },
            },
          },

          // --- 4. NUEVAS MÉTRICAS: LOGS DE TIEMPO (Para cálculo en vivo) ---
          logsTiempo: {
            select: {
              duracionMinutos: true,
              // Opcional: si quieres mostrar quién trabajó cuánto en el front
              // tecnico: { select: { nombre: true } },
            },
          },

          // --- 5. NUEVAS MÉTRICAS: RESUMEN FINAL (Para tickets cerrados) ---
          resumen: {
            select: {
              id: true,
              notasInternas: true,
              resueltoComo: true,
              tiempoTotalMinutos: true, // El total guardado al cerrar
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
      });

      const ticketsFormateados = tickets.map((ticket) => {
        // Helper para acompañantes
        const acompanantes = ticket.asignaciones.map(({ tecnico }) => ({
          id: tecnico.id,
          name: tecnico.nombre,
          rol: tecnico.rol,
        }));

        // --- CÁLCULO DE TIEMPO REAL (LIVE) ---
        // Sumamos los minutos de los logs existentes.
        // Esto sirve para ver el progreso en tickets ABIERTOS.
        const tiempoTrabajadoLive = ticket.logsTiempo.reduce((acc, log) => {
          return acc + (log.duracionMinutos || 0);
        }, 0);

        // Decisión de qué tiempo mostrar:
        // Si está cerrado y tiene resumen, usamos el histórico guardado.
        // Si está abierto, usamos la suma en vivo.
        const tiempoTotalDisplay =
          ticket.resumen?.tiempoTotalMinutos ?? tiempoTrabajadoLive;

        return {
          id: ticket.id,
          title: ticket.titulo,
          description: ticket.descripcion,
          status: ticket.estado,
          priority: ticket.prioridad,
          fixed: ticket.fijado,

          // --- USUARIOS ---
          assignee: ticket.tecnico
            ? {
                id: ticket.tecnico.id,
                name: ticket.tecnico.nombre,
                initials: ticket.tecnico.nombre.slice(0, 2).toUpperCase(),
              }
            : null,
          companios: acompanantes.length > 0 ? acompanantes : [],
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
                name: `${ticket.cliente.nombre} ${ticket.cliente.apellidos}`,
              }
            : null,

          // --- FECHAS Y ESTADO ---
          date: ticket.fechaApertura.toISOString(),
          closedAt: ticket.fechaCierre
            ? ticket.fechaCierre.toISOString()
            : null,
          unread: ticket.estado === 'ABIERTA',

          // --- TAGS ---
          tags: ticket.etiquetas.map((tag) => ({
            label: tag.etiqueta.nombre,
            value: tag.etiqueta.id,
          })),

          // --- COMENTARIOS ---
          comments: ticket.SeguimientoTicket.map((comment) => ({
            user: comment.usuario
              ? {
                  id: comment.usuario.id,
                  name: comment.usuario.nombre,
                  initials: comment.usuario.nombre.slice(0, 2).toUpperCase(),
                }
              : { id: -1, name: 'Usuario Eliminado', initials: 'NA' },
            text: comment.descripcion,
            date: comment.fechaRegistro.toISOString(),
          })),

          // --- NUEVA SECCIÓN: METRICS & RESUMEN ---
          metrics: {
            timeSpentMinutes: tiempoTotalDisplay, // Tiempo total (Vivo o Cerrado)
            logsCount: ticket.logsTiempo.length, // Cuantas veces se trabajó

            resolution: ticket.resumen
              ? {
                  solutionName:
                    ticket.resumen.solucion?.solucion || 'Sin categoría',
                  solutionDesc: ticket.resumen.solucion?.descripcion,
                  resolutionNote: ticket.resumen.resueltoComo,
                  internalNote: ticket.resumen.notasInternas,
                }
              : null,
          },
        };
      });

      return ticketsFormateados;
    } catch (error) {
      this.logger.error('Error al obtener los tickets:', error);
      throw new InternalServerErrorException('No se pudo obtener los tickets');
    }
  }

  // ===================== UPDATE GENERAL =====================
  async update(id: number, updateTicketsSoporteDto: UpdateTicketsSoporteDto) {
    this.logger.debug('ID Actualización: ', id);

    this.logger.log(
      `UpdateTicketsSoporteDto: \n${JSON.stringify(updateTicketsSoporteDto, null, 2)}`,
    );

    return await this.prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.ticketSoporte.update({
        where: { id },
        data: {
          titulo: updateTicketsSoporteDto.title,
          descripcion: updateTicketsSoporteDto.description,
          estado: updateTicketsSoporteDto.status,
          prioridad: updateTicketsSoporteDto.priority,
          fijado: updateTicketsSoporteDto.fixed,

          tecnico: updateTicketsSoporteDto.tecnicoId
            ? { connect: { id: updateTicketsSoporteDto.tecnicoId } }
            : { disconnect: true }, // Si envían null, desconectamos

          cliente: updateTicketsSoporteDto.clienteId
            ? { connect: { id: updateTicketsSoporteDto.clienteId } }
            : { disconnect: true },
        },
      });

      await tx.ticketEtiqueta.deleteMany({
        where: { ticketId: id },
      });

      const tagsIds = updateTicketsSoporteDto.tags;

      if (tagsIds && tagsIds.length > 0) {
        const cleanTagIds = tagsIds.map((id) => Number(id));

        await tx.ticketSoporte.update({
          where: { id },
          data: {
            etiquetas: {
              create: cleanTagIds.map((tagId) => ({
                etiqueta: {
                  connect: { id: tagId },
                },
              })),
            },
          },
        });
      }

      await tx.ticketSoporteTecnico.deleteMany({
        where: { ticketId: id },
      });

      if (updateTicketsSoporteDto.tecnicosAdicionales?.length > 0) {
        await tx.ticketSoporteTecnico.createMany({
          data: updateTicketsSoporteDto.tecnicosAdicionales.map(
            (tecnicoId) => ({
              ticketId: id,
              tecnicoId: Number(tecnicoId),
            }),
          ),
        });
      }

      return updatedTicket;
    });
  }

  // ===================== CLOSE =====================
  async closeTickets(id: number, dto: CloseTicketDto) {
    try {
      const ticketToClose = await this.prisma.ticketSoporte.findUnique({
        where: { id },
      });

      if (!ticketToClose) {
        throw new NotFoundException('Ticket no encontrado');
      }

      // 1. PASO CRÍTICO: CERRAR EL RELOJ (Stop Timer)
      await this.updateStatusEnRevision(id);

      // 2. CALCULAR TOTALES
      const tiempoTotal =
        await this.ticketsRepo.obtenerTiempoTotalTrabajado(id);

      const dtoSolucion: CreateTicketResumenDto = {
        ticketId: id,
        notasInternas: dto.notasInternas,
        resueltoComo: dto.resueltoComo,
        solucionId: dto.solucionId,
        tiempoTotalMinutos: tiempoTotal,
      };

      // 3. ACTUALIZAR METADATA DEL TICKET (Etiquetas)
      await this.prisma.ticketEtiqueta.deleteMany({
        where: { ticketId: id },
      });

      const etiquetasToAssign =
        dto.tags?.map((tag) => ({
          ticketId: id,
          etiquetaId: tag.value,
        })) ?? [];

      if (etiquetasToAssign.length > 0) {
        await this.prisma.ticketEtiqueta.createMany({
          data: etiquetasToAssign,
          skipDuplicates: true,
        });
      }

      // 4. CERRAR TICKET OFICIALMENTE (Estado: RESUELTA)
      const ticketClosed = await this.prisma.ticketSoporte.update({
        where: { id },
        data: {
          titulo: dto.title,
          descripcion: dto.description,
          estado: EstadoTicketSoporte.RESUELTA,
          prioridad: dto.priority,
          fechaCierre: dayjs().toDate(),
          fechaResolucionTecnico: dayjs().toDate(),
          tecnico: dto.assignee?.id
            ? { connect: { id: dto.assignee.id } }
            : undefined,
        },
      });

      // 5. METAS Y MÉTRICAS
      const companios = await this.prisma.ticketSoporte.findUnique({
        where: { id: ticketClosed.id },
        select: {
          asignaciones: { select: { tecnico: { select: { id: true } } } },
        },
      });
      const acompanantes =
        companios?.asignaciones?.map((tec) => tec.tecnico.id) ?? [];

      if (ticketClosed.tecnicoId) {
        await this.metasTicketSoporte.incrementMeta(ticketClosed.tecnicoId);
      }
      if (acompanantes.length > 0) {
        for (const tec of acompanantes) {
          await this.metasTicketSoporte.incrementMeta(tec);
        }
      }

      // 6. CREAR RESUMEN (Histórico)
      await this.ticketResumen.create(dtoSolucion);

      return {
        message: 'Ticket cerrado con éxito',
        ticket: ticketClosed,
      };
    } catch (error) {
      this.logger.error('Error al cerrar ticket: ', error);
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

    ticket.marcarEnProceso();
    const updated = await this.ticketsRepo.update(ticket);

    // LOGICA TIME LOG
    const logAbierto = await this.prisma.ticketTimeLog.findFirst({
      where: { ticketId, fin: null },
    });

    if (!logAbierto) {
      await this.prisma.ticketTimeLog.create({
        data: {
          ticketId,
          tecnicoId: updated.tecnicoId!,
          inicio: dayjs().toDate(),
        },
      });
    }

    const tecnicoNombre = updated.tecnicoId
      ? (
          await this.prisma.usuario.findUnique({
            where: { id: updated.tecnicoId },
            select: { nombre: true },
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

    return { id: updated.id!, estado: updated.estado };
  }

  async updateStatusEnRevision(
    ticketId: number,
  ): Promise<{ id: number; estado: string }> {
    const ticket = await this.ticketsRepo.findById(ticketId);

    if (!ticket) {
      throw new NotFoundException(`Ticket con id ${ticketId} no encontrado`);
    }

    ticket.marcarEnRevision();
    const updated = await this.ticketsRepo.update(ticket);

    const logAbierto = await this.prisma.ticketTimeLog.findFirst({
      where: { ticketId, fin: null },
    });

    if (logAbierto) {
      const ahora = dayjs().toDate();

      const inicioDayjs = dayjs(logAbierto.inicio);
      const ahoraDayjs = dayjs(ahora);

      const minutosReales = ahoraDayjs.diff(inicioDayjs, 'minutes');

      await this.prisma.ticketTimeLog.update({
        where: { id: logAbierto.id },
        data: {
          fin: ahora,
          duracionMinutos: minutosReales > 0 ? minutosReales : 1,
        },
      });
    }

    const tecnicoNombre = updated.tecnicoId
      ? (
          await this.prisma.usuario.findUnique({
            where: { id: updated.tecnicoId },
            select: { nombre: true },
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

    return { id: updated.id!, estado: updated.estado };
  }
}
