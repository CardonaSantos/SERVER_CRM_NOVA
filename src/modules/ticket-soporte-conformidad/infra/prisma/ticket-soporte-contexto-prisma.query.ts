import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TicketSoporteContextoQueryPort } from '../../domain/ports/ticket-soporte-contexto-query.port';
import { TicketSoporteContextoReadModel } from '../../domain/read-models/ticket-soporte-conformidad.read-model';

@Injectable()
export class TicketSoporteContextoPrismaQuery
  implements TicketSoporteContextoQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findContextById(
    ticketId: number,
  ): Promise<TicketSoporteContextoReadModel | null> {
    const ticket = await this.prisma.ticketSoporte.findUnique({
      where: { id: ticketId },
      select: { id: true, empresaId: true, clienteId: true, tecnicoId: true },
    });

    if (!ticket) return null;

    return {
      ticketId: ticket.id,
      empresaId: ticket.empresaId,
      clienteId: ticket.clienteId,
      tecnicoId: ticket.tecnicoId,
    };
  }
}
