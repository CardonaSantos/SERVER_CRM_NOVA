import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import { CicloTrabajo } from '../../domain/policies/tiempos-ticket.policy';
import {
  CerrarResumenParams,
  TicketRepositoryPort,
} from '../../domain/ports/ticket-repository.port';
import {
  TICKET_CON_RELACIONES,
  TicketPrismaMapper,
} from './ticket-prisma.mapper';

@Injectable()
export class TicketPrismaRepository implements TicketRepositoryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async findById(id: number): Promise<TicketEntity | null> {
    const record = await this.db.ticketSoporte.findUnique({
      where: { id },
      include: TICKET_CON_RELACIONES,
    });

    return record ? TicketPrismaMapper.toDomain(record) : null;
  }

  async bloquear(id: number): Promise<TicketEntity | null> {
    await this.db
      .$queryRaw`SELECT id FROM "TicketSoporte" WHERE id = ${id} FOR UPDATE`;

    return this.findById(id);
  }

  async create(ticket: TicketEntity): Promise<TicketEntity> {
    const { apoyoIds, etiquetaIds } = ticket.toPrimitives();

    const record = await this.db.ticketSoporte.create({
      data: {
        ...TicketPrismaMapper.toPersistence(ticket),
        creadoEn: ticket.fechaApertura,
        asignaciones: {
          create: apoyoIds.map((tecnicoId) => ({ tecnicoId })),
        },
        etiquetas: {
          create: etiquetaIds.map((etiquetaId) => ({ etiquetaId })),
        },
      },
      include: TICKET_CON_RELACIONES,
    });

    return TicketPrismaMapper.toDomain(record);
  }

  async update(ticket: TicketEntity): Promise<TicketEntity> {
    const ticketId = ticket.id!;
    const { apoyoIds, etiquetaIds } = ticket.toPrimitives();

    // Solo se quitan y agregan las diferencias: lo que sigue no se reescribe.
    await this.db.ticketSoporteTecnico.deleteMany({
      where: { ticketId, tecnicoId: { notIn: apoyoIds } },
    });
    await this.db.ticketSoporteTecnico.createMany({
      data: apoyoIds.map((tecnicoId) => ({ ticketId, tecnicoId })),
      skipDuplicates: true,
    });
    await this.db.ticketEtiqueta.deleteMany({
      where: { ticketId, etiquetaId: { notIn: etiquetaIds } },
    });
    await this.db.ticketEtiqueta.createMany({
      data: etiquetaIds.map((etiquetaId) => ({ ticketId, etiquetaId })),
      skipDuplicates: true,
    });

    const record = await this.db.ticketSoporte.update({
      where: { id: ticketId },
      data: TicketPrismaMapper.toPersistence(ticket),
      include: TICKET_CON_RELACIONES,
    });

    return TicketPrismaMapper.toDomain(record);
  }

  ciclos(ticketId: number): Promise<CicloTrabajo[]> {
    return this.db.ticketTimeLog.findMany({
      where: { ticketId },
      select: { id: true, inicio: true, fin: true, duracionMinutos: true },
      orderBy: { id: 'asc' },
    });
  }

  async abrirCiclo(
    ticketId: number,
    tecnicoId: number,
    inicio: Date,
  ): Promise<void> {
    await this.db.ticketTimeLog.create({
      data: { ticketId, tecnicoId, inicio },
    });
  }

  async cerrarCiclo(
    cicloId: number,
    fin: Date,
    minutos: number,
  ): Promise<void> {
    await this.db.ticketTimeLog.update({
      where: { id: cicloId },
      data: { fin, duracionMinutos: minutos },
    });
  }

  async reaperturas(ticketId: number): Promise<number> {
    const resumen = await this.db.ticketResumen.findUnique({
      where: { ticketId },
      select: { numeroReaperturas: true },
    });

    return resumen?.numeroReaperturas ?? 0;
  }

  async cerrarResumen({
    ticketId,
    ...datos
  }: CerrarResumenParams): Promise<void> {
    await this.db.ticketResumen.upsert({
      where: { ticketId },
      update: { ...datos, reabierto: false },
      create: { ticketId, ...datos, reabierto: false },
    });
  }

  async registrarReapertura(ticketId: number): Promise<void> {
    await this.db.ticketResumen.upsert({
      where: { ticketId },
      update: {
        reabierto: true,
        numeroReaperturas: { increment: 1 },
        intentos: { increment: 1 },
      },
      create: { ticketId, reabierto: true, numeroReaperturas: 1, intentos: 2 },
    });
  }
}
