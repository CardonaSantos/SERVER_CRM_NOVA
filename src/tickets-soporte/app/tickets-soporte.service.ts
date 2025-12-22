import {
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
        titulo: ticketInfo.titulo ?? 'Sin título',
        descripcion: ticketInfo.descripcion ?? 'Sin descripción',
        estado: ticketInfo.estado,
        prioridad: ticketInfo.prioridad,
        fechaApertura: ticketInfo.fechaApertura,
        fechaCierre: ticketInfo.fechaCierre ?? null,

        cliente: {
          id: ticketInfo.cliente.id,
          nombreCompleto: `${ticketInfo.cliente.nombre} ${ticketInfo.cliente.apellidos}`,
          telefono: ticketInfo.cliente.telefono,
          direccion: ticketInfo.cliente.direccion,
        },

        tecnico: ticketInfo.tecnico
          ? {
              id: ticketInfo.tecnico.id,
              nombre: ticketInfo.tecnico.nombre,
            }
          : null,

        empresa: {
          id: ticketInfo.empresa.id,
          nombre: ticketInfo.empresa.nombre,
          direccion: ticketInfo.empresa.direccion,
          correo: ticketInfo.empresa.correo,
          telefono: ticketInfo.empresa.telefono,
          pbx: ticketInfo.empresa.pbx,
        },

        fechaGeneracionBoleta: new Date(),
      };

      return boletaData;
    } catch (error) {
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
          fechaApertura: true,
          fechaCierre: true,
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
            },
          },
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
                },
              },
            },
          },
        },
      });

      const ticketsFormateados = tickets.map((ticket) => {
        const acompanantes = ticket.asignaciones.map(({ tecnico }) => ({
          id: tecnico.id,
          name: tecnico.nombre,
          rol: tecnico.rol,
        }));

        return {
          id: ticket.id,
          title: ticket.titulo,
          description: ticket.descripcion,
          status: ticket.estado,
          priority: ticket.prioridad,
          fixed: ticket.fijado,

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
                id: 0, // ID ficticio para el bot
                name: 'Sistema (Bot)', // Nombre amigable para mostrar
                initials: 'BT',
                rol: 'SISTEMA',
              },
          date: ticket.fechaApertura.toISOString(),
          closedAt: ticket.fechaCierre
            ? ticket.fechaCierre.toISOString()
            : null,
          unread: ticket.estado === 'ABIERTA',
          tags: ticket.etiquetas.map((tag) => ({
            label: tag.etiqueta.nombre,
            value: tag.etiqueta.id,
          })),
          customer: ticket.cliente
            ? {
                id: ticket.cliente.id,
                name: `${ticket.cliente.nombre} ${ticket.cliente.apellidos}`,
              }
            : null,
          comments: ticket.SeguimientoTicket.map((comment) => ({
            user: comment.usuario // Validación extra por si se borró el usuario del comentario
              ? {
                  id: comment.usuario.id,
                  name: comment.usuario.nombre,
                  initials: comment.usuario.nombre.slice(0, 2).toUpperCase(),
                }
              : { id: -1, name: 'Usuario Eliminado', initials: 'NA' },
            text: comment.descripcion,
            date: comment.fechaRegistro.toISOString(),
          })),
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

      await this.prisma.ticketEtiqueta.deleteMany({
        where: {
          ticketId: id,
        },
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

      const ticketClosed = await this.prisma.ticketSoporte.update({
        where: { id },
        data: {
          titulo: dto.title,
          descripcion: dto.description,
          estado: EstadoTicketSoporte.RESUELTA,
          prioridad: dto.priority,
          fechaCierre: new Date(),
          tecnico: dto.assignee?.id
            ? { connect: { id: dto.assignee.id } }
            : undefined,
        },
      });

      const companios = await this.prisma.ticketSoporte.findUnique({
        where: {
          id: ticketClosed.id,
        },
        select: {
          asignaciones: {
            select: {
              tecnico: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      const acompanantes =
        companios?.asignaciones?.map((tec) => tec.tecnico.id) ?? [];

      await this.prisma.seguimientoTicket.create({
        data: {
          descripcion: dto.comentario,
          ticket: { connect: { id: dto.ticketId } },
          usuario: { connect: { id: dto.usuarioId } },
        },
      });

      const user = ticketClosed.tecnicoId
        ? await this.prisma.clienteInternet.findUnique({
            where: {
              id: ticketClosed.tecnicoId,
            },
          })
        : null;

      if (ticketClosed.tecnicoId) {
        this.logger.debug('Incrementando meta para tecnico main', user);
        await this.metasTicketSoporte.incrementMeta(ticketClosed.tecnicoId);
      }

      if (acompanantes.length > 0) {
        this.logger.debug('Incrementando resultos en metas para acompanantes');
        for (const tec of acompanantes) {
          this.logger.debug('Incrementando meta para: ', tec);
          await this.metasTicketSoporte.incrementMeta(tec);
        }
      }

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

    ticket.marcarEnProceso();
    const updated = await this.ticketsRepo.update(ticket);

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

    ticket.marcarEnRevision();
    const updated = await this.ticketsRepo.update(ticket);

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

    return {
      id: updated.id!,
      estado: updated.estado,
    };
  }
}
