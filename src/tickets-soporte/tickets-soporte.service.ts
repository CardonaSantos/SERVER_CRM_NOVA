import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateTicketsSoporteDto } from './dto/create-tickets-soporte.dto';
import { UpdateTicketsSoporteDto } from './dto/update-tickets-soporte.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloseTicketDto } from './dto/CloseTicketDto .dto';
import { GenerarMensajeSoporteService } from './generar-mensaje-soporte/generar-mensaje-soporte.service';
import { MetasTicketsService } from 'src/metas-tickets/metas-tickets.service';
import { UpdateTicketStatusDto } from './dto/updateStatus';

@Injectable()
export class TicketsSoporteService {
  private readonly logger = new Logger(TicketsSoporteService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioMessageSuport: GenerarMensajeSoporteService,
    private readonly metasTicketSoporte: MetasTicketsService,
  ) {}
  //Crear ticket soporte
  async create(createTicketsSoporteDto: CreateTicketsSoporteDto) {
    console.log('La data del ticket soporte: ', createTicketsSoporteDto);

    const newTicketSoporte = await this.prisma.$transaction(async (tx) => {
      const newTicketSoporte = await tx.ticketSoporte.create({
        data: {
          cliente: {
            connect: {
              id: createTicketsSoporteDto.clienteId,
            },
          },
          titulo: createTicketsSoporteDto.titulo,
          descripcion: createTicketsSoporteDto.descripcion,
          creadoPor: {
            connect: {
              id: createTicketsSoporteDto.userId,
            },
          },
          empresa: {
            connect: {
              id: createTicketsSoporteDto.empresaId,
            },
          },
          tecnico: createTicketsSoporteDto.tecnicoId
            ? { connect: { id: createTicketsSoporteDto.tecnicoId } } // Si se pasa tecnicoId, conectamos
            : {}, // Si no se pasa tecnicoId, desconectamos (o dejamos nulo)

          asignaciones:
            createTicketsSoporteDto.tecnicosAdicionales.length > 0
              ? {
                  create: createTicketsSoporteDto.tecnicosAdicionales.map(
                    (tecnicoId) => ({ tecnicoId }),
                  ),
                }
              : undefined,

          prioridad: createTicketsSoporteDto.prioridad,
          estado: createTicketsSoporteDto.estado,
          etiquetas: {
            create: createTicketsSoporteDto.etiquetas.map((tagId) => ({
              etiqueta: {
                connect: { id: tagId },
              },
            })),
          },
        },
      });

      return newTicketSoporte;
    });

    this.logger.debug(
      'El nuevo ticket con formato de asistentes es: ',
      newTicketSoporte,
    );

    await this.twilioMessageSuport.GenerarMensajeTicketSoporte(
      createTicketsSoporteDto.clienteId,
      newTicketSoporte.id,
    );
  }

  findAll() {
    return `This action returns all ticketsSoporte`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ticketsSoporte`;
  }

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
      console.error('Error al generar boleta de ticket:', error);
      throw new InternalServerErrorException('Error al generar boleta');
    }
  }

  async update(id: number, updateTicketsSoporteDto: UpdateTicketsSoporteDto) {
    console.log('ID: ', id);
    console.log('Los datos entrantes son: ', updateTicketsSoporteDto);

    return await this.prisma.$transaction(async (tx) => {
      // Actualizamos los campos principales del ticket
      const updatedTicket = await tx.ticketSoporte.update({
        where: { id },
        data: {
          titulo: updateTicketsSoporteDto.title,
          descripcion: updateTicketsSoporteDto.description,
          estado: updateTicketsSoporteDto.status,
          prioridad: updateTicketsSoporteDto.priority,
          // Actualizamos el técnico asignado si se envía (si no, lo dejamos sin cambios)
          // Actualizamos el técnico: conectamos si se envía, sino desconectamos
          tecnico:
            updateTicketsSoporteDto.assignee &&
            updateTicketsSoporteDto.assignee.id
              ? { connect: { id: updateTicketsSoporteDto.assignee.id } }
              : { disconnect: true },
        },
      });

      // Actualizamos las etiquetas:
      // 1. Eliminamos todas las asociaciones actuales en la tabla intermedia
      await tx.ticketEtiqueta.deleteMany({
        where: { ticketId: id },
      });

      // 2. Si se envían etiquetas, creamos las nuevas asociaciones.
      if (
        updateTicketsSoporteDto.tags &&
        updateTicketsSoporteDto.tags.length > 0
      ) {
        await tx.ticketSoporte.update({
          where: { id },
          data: {
            etiquetas: {
              create: updateTicketsSoporteDto.tags.map(
                (tag: { value: number; label: string }) => ({
                  etiqueta: {
                    connect: { id: Number(tag.value) },
                  },
                }),
              ),
            },
          },
        });
      }

      console.log('El ticket actualizado es: ', updatedTicket);

      return updatedTicket;
    });
  }

  /**
   *
   * @param id Id del ticket a cerrar
   * @param dto comentario, ticketId e id del usuario que cerró
   * @returns
   */
  async closeTickets(id: number, dto: CloseTicketDto) {
    try {
      const ticketToClose = await this.prisma.ticketSoporte.findUnique({
        where: { id },
      });

      if (!ticketToClose) {
        throw new NotFoundException('Ticket no encontrado');
      }

      // 1. Eliminar etiquetas actuales
      await this.prisma.ticketEtiqueta.deleteMany({
        where: {
          ticketId: id,
        },
      });

      // 2. Asignar nuevas etiquetas
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

      // 3. Actualizar ticket
      const ticketClosed = await this.prisma.ticketSoporte.update({
        where: { id },
        data: {
          titulo: dto.title,
          descripcion: dto.description,
          estado: 'RESUELTA',
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

      let acompanantes = companios?.asignaciones?.map((tec) => tec.tecnico.id);

      // 4. Agregar seguimiento
      await this.prisma.seguimientoTicket.create({
        data: {
          descripcion: dto.comentario,
          ticket: { connect: { id: dto.ticketId } },
          usuario: { connect: { id: dto.usuarioId } },
        },
      });

      if (ticketClosed.tecnicoId) {
        this.logger.debug('Incrementando meta para tecnico main');
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
      console.error('Error al cerrar ticket: ', error);
      throw new InternalServerErrorException('No se pudo cerrar el ticket');
    }
  }

  async delete(ticketId: number) {
    return await this.prisma.$transaction(async (tx) => {
      // Luego, eliminamos el ticket
      const deletedTicket = await tx.ticketSoporte.delete({
        where: {
          id: ticketId,
        },
      });
      console.log('El ticket eliminado es: ', deletedTicket);

      return deletedTicket;
    });
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
          tecnico: {
            // Obtener el técnico asignado
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
            // Obtener el creador del ticket
            select: {
              id: true,
              nombre: true,
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
            // Obtener etiquetas asociadas
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
            // Obtener comentarios o seguimientos del ticket
            select: {
              descripcion: true,
              fechaRegistro: true,
              usuario: {
                // Obtener el usuario que dejó el comentario
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      });

      // const flatAcompanantes = tickets

      // Transformar los datos para adaptarlos a la estructura del tipo Ticket
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
          assignee: ticket.tecnico
            ? {
                id: ticket.tecnico.id,
                name: ticket.tecnico.nombre,
                initials: ticket.tecnico.nombre.slice(0, 2).toUpperCase(), // Tomar las iniciales
              }
            : null,
          companios: acompanantes.length > 0 ? acompanantes : [],
          creator: ticket.creadoPor
            ? {
                id: ticket.creadoPor.id,
                name: ticket.creadoPor.nombre,
                initials: ticket.creadoPor.nombre.slice(0, 2).toUpperCase(),
              }
            : null,
          date: ticket.fechaApertura.toISOString(), // Formato de fecha
          unread: ticket.estado === 'ABIERTA', // Definir si está "sin leer" basado en el estado
          tags: ticket.etiquetas.map((tag) => ({
            label: tag.etiqueta.nombre,
            value: tag.etiqueta.id,
          })),
          customer: {
            id: ticket.cliente.id,
            name: `${ticket.cliente.nombre} ${ticket.cliente.apellidos}`,
          },
          comments: ticket.SeguimientoTicket.map((comment) => ({
            user: {
              id: comment.usuario.id,
              name: comment.usuario.nombre,
              initials: comment.usuario.nombre.slice(0, 2).toUpperCase(),
            },
            text: comment.descripcion,
            date: comment.fechaRegistro.toISOString(),
          })),
        };
      });

      return ticketsFormateados;
    } catch (error) {
      console.error('Error al obtener los tickets:', error);
      throw new Error('No se pudo obtener los tickets');
    }
  }

  async removeAll() {
    try {
      const ticketToDelete = await this.prisma.ticketSoporte.deleteMany({});
      return ticketToDelete;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Actualiza el campo `estado` de un ticket de soporte.
   */
  async updateStatus(
    ticketId: number,
    dto: UpdateTicketStatusDto,
  ): Promise<{ id: number; estado: string }> {
    // Verificar que existe el ticket
    console.log('la data llegnaod es', ticketId, dto);

    const existing = await this.prisma.ticketSoporte.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(`Ticket con id ${ticketId} no encontrado`);
    }

    // Actualizar el estado
    const updated = await this.prisma.ticketSoporte.update({
      where: { id: ticketId },
      data: { estado: dto.estado },
      select: { id: true, estado: true },
    });

    return updated;
  }
}
