import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ComentarioTicketEntity } from '../../domain/entities/comentario-ticket.entity';
import {
  ComentarioImagenNoEncontradaError,
  ComentarioNoEncontradoError,
} from '../../domain/errors/ticket-soporte.errors';
import { ComentarioTicketRepositoryPort } from '../../domain/ports/comentario-ticket-repository.port';

const CON_IMAGENES = {
  medios: {
    where: { eliminadoEn: null },
    select: { mediaId: true },
    orderBy: { orden: 'asc' },
  },
} satisfies Prisma.SeguimientoTicketInclude;

type Registro = Prisma.SeguimientoTicketGetPayload<{
  include: typeof CON_IMAGENES;
}>;

function aDominio(record: Registro): ComentarioTicketEntity {
  return ComentarioTicketEntity.hydrate({
    id: record.id,
    ticketId: record.ticketId,
    usuarioId: record.usuarioId,
    texto: record.descripcion,
    fechaRegistro: record.fechaRegistro,
    editadoEn: record.editadoEn,
    imagenIds: record.medios.map((medio) => medio.mediaId),
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
      include: CON_IMAGENES,
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
      include: CON_IMAGENES,
    });

    return record ? aDominio(record) : null;
  }

  async bloquear(id: number): Promise<ComentarioTicketEntity | null> {
    await this.db
      .$queryRaw`SELECT id FROM "SeguimientoTicket" WHERE id = ${id} FOR UPDATE`;

    return this.findById(id);
  }

  async guardarTexto(comentario: ComentarioTicketEntity): Promise<void> {
    const { texto, editadoEn, ticketId } = comentario.toPrimitives();

    await this.db.seguimientoTicket.update({
      where: { id: comentario.id! },
      data: { descripcion: texto, editadoEn },
    });
    await this.db.ticketSoporte.update({
      where: { id: ticketId },
      data: { actualizadoEn: editadoEn! },
    });
  }

  async quitarImagen(
    comentarioId: number,
    imagenId: number,
    usuarioId: number,
    fecha: Date,
  ): Promise<void> {
    const { count } = await this.db.seguimientoTicketMedia.updateMany({
      where: {
        seguimientoId: comentarioId,
        mediaId: imagenId,
        eliminadoEn: null,
      },
      data: { eliminadoEn: fecha, eliminadoPorId: usuarioId },
    });
    if (count === 0) throw new ComentarioImagenNoEncontradaError();
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
