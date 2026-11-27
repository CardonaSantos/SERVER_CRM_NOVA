import { Injectable } from '@nestjs/common';
import { SeguimientoTicket } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ComentarioTicketEntity } from '../../domain/entities/comentario-ticket.entity';
import { ComentarioNoEncontradoError } from '../../domain/errors/ticket-soporte.errors';
import { ComentarioTicketRepositoryPort } from '../../domain/ports/comentario-ticket-repository.port';

function aDominio(record: SeguimientoTicket): ComentarioTicketEntity {
  return ComentarioTicketEntity.hydrate({
    id: record.id,
    ticketId: record.ticketId,
    usuarioId: record.usuarioId,
    texto: record.descripcion,
    fechaRegistro: record.fechaRegistro,
    eliminadoEn: record.eliminadoEn,
    eliminadoPorId: record.eliminadoPorId,
  });
}

@Injectable()
export class ComentarioTicketPrismaRepository
  implements ComentarioTicketRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async create(
    comentario: ComentarioTicketEntity,
    mediaIds: number[],
  ): Promise<ComentarioTicketEntity> {
    const datos = comentario.toPrimitives();

    const record = await this.db.seguimientoTicket.create({
      data: {
        ticketId: datos.ticketId,
        usuarioId: datos.usuarioId,
        descripcion: datos.texto,
        fechaRegistro: datos.fechaRegistro,
        medios: {
          create: mediaIds.map((mediaId, orden) => ({ mediaId, orden })),
        },
      },
    });
    await this.db.ticketSoporte.update({
      where: { id: datos.ticketId },
      data: { actualizadoEn: datos.fechaRegistro },
    });

    return aDominio(record);
  }

  async findById(id: number): Promise<ComentarioTicketEntity | null> {
    const record = await this.db.seguimientoTicket.findUnique({
      where: { id },
    });

    return record ? aDominio(record) : null;
  }

  async marcarEliminado(comentario: ComentarioTicketEntity): Promise<void> {
    const { eliminadoEn, eliminadoPorId } = comentario.toPrimitives();

    const { count } = await this.db.seguimientoTicket.updateMany({
      where: { id: comentario.id!, eliminadoEn: null },
      data: { eliminadoEn, eliminadoPorId },
    });
    if (count === 0) throw new ComentarioNoEncontradoError();
  }
}
