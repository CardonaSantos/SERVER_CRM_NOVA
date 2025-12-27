import { throwFatalError } from 'src/Utils/CommonFatalError';
import { TicketResumenRepository } from '../domain/ticket-resumen.repository';
import { TicketResumen } from '../entities/ticket-resuman.entity';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TicketResumen as TicketResumenRow } from '@prisma/client';

@Injectable()
export class PrismaTicketResumenRepository implements TicketResumenRepository {
  private readonly logger = new Logger(PrismaTicketResumenRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: TicketResumenRow): TicketResumen {
    return TicketResumen.fromPrisma(row);
  }

  async create(ticketResumen: TicketResumen): Promise<TicketResumen> {
    try {
      const data = ticketResumen.toObject();
const ticketTimeLog = await this.prisma.ticketSoporte.findUnique({
  where: {
    id: data.ticketId
  },
  select: {
    logsTiempo: {
      select: {
        id: true,
        duracionMinutos: true,
        inicio: true,
        fin: true,
      }
    }
  }
})

      const totalTiempo =  ticketTimeLog.logsTiempo.reduce((acc, tiempo)=> acc + tiempo.duracionMinutos,0)

      const created = await this.prisma.ticketResumen.create({
        data: {
          ticketId: data.ticketId,
          solucionId: data.solucionId,
          resueltoComo: data.resueltoComo,
          notasInternas: data.notasInternas,
          reabierto: data.reabierto,
          numeroReaperturas: data.numeroReaperturas,
          intentos: data.intentos,
          tiempoTotalMinutos: totalTiempo,
          tiempoTecnicoMinutos: data.tiempoTecnicoMinutos,
        },
      });

      return this.toDomain(created);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaTicketResumenRepository - create',
      );
    }
  }

  async findById(id: number): Promise<TicketResumen | null> {
    try {
      const row = await this.prisma.ticketResumen.findUnique({
        where: { id },
      });
      if (!row) return null;
      return this.toDomain(row);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaTicketResumenRepository - findById',
      );
    }
  }

  async findByTicketId(ticketId: number): Promise<TicketResumen | null> {
    try {
      const row = await this.prisma.ticketResumen.findUnique({
        where: { ticketId },
      });
      if (!row) return null;
      return this.toDomain(row);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaTicketResumenRepository - findByTicketId',
      );
    }
  }

  async getAll(): Promise<TicketResumen[]> {
    try {
      const rows = await this.prisma.ticketResumen.findMany({
        orderBy: { creadoEn: 'desc' },
      });
      return rows.map((r) => this.toDomain(r));
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaTicketResumenRepository - getAll',
      );
    }
  }

  async update(ticketResumen: TicketResumen): Promise<TicketResumen> {
    try {
      const data = ticketResumen.toObject();

      if (!data.id) {
        throw new Error(
          'No se puede actualizar TicketResumen sin id (data.id es undefined)',
        );
      }

      const updated = await this.prisma.ticketResumen.update({
        where: { id: data.id },
        data: {
          solucionId: data.solucionId,
          resueltoComo: data.resueltoComo,
          notasInternas: data.notasInternas,
          reabierto: data.reabierto,
          numeroReaperturas: data.numeroReaperturas,
          intentos: data.intentos,
          tiempoTotalMinutos: data.tiempoTotalMinutos,
          tiempoTecnicoMinutos: data.tiempoTecnicoMinutos,
        },
      });

      return this.toDomain(updated);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaTicketResumenRepository - update',
      );
    }
  }

  async deleteById(id: number): Promise<TicketResumen | null> {
    try {
      const deleted = await this.prisma.ticketResumen.delete({
        where: { id },
      });

      return this.toDomain(deleted);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaTicketResumenRepository - deleteById',
      );
    }
  }

  async deleteAll(): Promise<number> {
    try {
      const result = await this.prisma.ticketResumen.deleteMany({});
      return result.count;
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaTicketResumenRepository - deleteAll',
      );
    }
  }
}
