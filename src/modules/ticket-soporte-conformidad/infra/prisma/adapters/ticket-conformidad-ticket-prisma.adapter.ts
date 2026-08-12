import { Injectable } from '@nestjs/common';
import {
  TicketConformidadTicketContext,
  TicketConformidadTicketPort,
} from 'src/modules/ticket-soporte-conformidad/application/port/ticket-conformidad-ticket.port';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TicketConformidadTicketPrismaAdapter
  implements TicketConformidadTicketPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findContextById(
    ticketId: number,
  ): Promise<TicketConformidadTicketContext | null> {
    const ticket = await this.prisma.ticketSoporte.findUnique({
      where: {
        id: ticketId,
      },

      select: {
        id: true,
        empresaId: true,
        clienteId: true,
        tecnicoId: true,
      },
    });

    if (!ticket) {
      return null;
    }

    return {
      ticketId: ticket.id,

      empresaId: ticket.empresaId,
      clienteId: ticket.clienteId,
      tecnicoId: ticket.tecnicoId,
    };
  }
}
