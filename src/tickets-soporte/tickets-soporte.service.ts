import { Injectable } from '@nestjs/common';
import { CreateTicketsSoporteDto } from './dto/create-tickets-soporte.dto';
import { UpdateTicketsSoporteDto } from './dto/update-tickets-soporte.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TicketsSoporteService {
  constructor(private readonly prisma: PrismaService) {}
  //Crear ticket soporte
  async create(createTicketsSoporteDto: CreateTicketsSoporteDto) {
    console.log('La data del ticket soporte: ', createTicketsSoporteDto);

    return await this.prisma.$transaction(async (tx) => {
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

      console.log('El ticket es: ', newTicketSoporte);

      return newTicketSoporte;
    });
  }

  findAll() {
    return `This action returns all ticketsSoporte`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ticketsSoporte`;
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
      // Transformar los datos para adaptarlos a la estructura del tipo Ticket
      const ticketsFormateados = tickets.map((ticket) => ({
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
      }));

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
}
