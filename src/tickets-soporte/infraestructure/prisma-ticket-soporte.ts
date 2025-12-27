// src/tickets/infra/prisma-ticket-soporte.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TicketSoporteRepository } from '../domain/ticket-soporte-repository';
import { TicketSoporte } from '../entities/tickets-soporte.entity';
import { throwFatalError } from 'src/Utils/CommonFatalError';

@Injectable()
export class PrismaTicketSoporteRepository implements TicketSoporteRepository {
  private readonly logger = new Logger(PrismaTicketSoporteRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: any): TicketSoporte {
    return TicketSoporte.fromPrisma(row);
  }

  async create(ticket: TicketSoporte): Promise<TicketSoporte> {
    try {
      const data = ticket.toObject();

      const created = await this.prisma.ticketSoporte.create({
        data: {
          clienteId: data.clienteId,
          empresaId: data.empresaId,
          tecnicoId: data.tecnicoId,
          creadoPorId: data.creadoPorId,
          estado: data.estado,
          prioridad: data.prioridad,
          titulo: data.titulo,
          descripcion: data.descripcion,
          fechaApertura: data.fechaApertura,
          fechaCierre: data.fechaCierre,
          fechaAsignacion: data.fechaAsignacion,
          fechaInicioAtencion: data.fechaInicioAtencion,
          fechaResolucionTecnico: data.fechaResolucionTecnico,
          fijado: data.fijado,
          // creadoEn / actualizadoEn suelen dejarlos a Prisma
        },
      });

      return this.toDomain(created);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaTicketSoporteRepository -create',
      );
    }
  }

  async update(ticket: TicketSoporte): Promise<TicketSoporte> {
    try {
      const data = ticket.toObject();

      const updated = await this.prisma.ticketSoporte.update({
        where: { id: data.id! },
        data: {
          estado: data.estado,
          prioridad: data.prioridad,
          titulo: data.titulo,
          descripcion: data.descripcion,
          fechaCierre: data.fechaCierre,
          fechaAsignacion: data.fechaAsignacion,
          fechaInicioAtencion: data.fechaInicioAtencion,
          fechaResolucionTecnico: data.fechaResolucionTecnico,
          fijado: data.fijado,
          
        },
      });
      return this.toDomain(updated);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaTicketSoporteRepository -update',
      );
    }
  }

  async findById(id: number): Promise<TicketSoporte | null> {
    try {
      const row = await this.prisma.ticketSoporte.findUnique({ where: { id } });
      if (!row) return null;
      return this.toDomain(row);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaTicketSoporteRepository -findById',
      );
    }
  }

  async findAbiertosByCliente(clienteId: number): Promise<TicketSoporte[]> {
    try {
      const rows = await this.prisma.ticketSoporte.findMany({
        where: { clienteId, estado: 'ABIERTA' },
        orderBy: { fechaApertura: 'desc' },
      });
      return rows.map((r) => this.toDomain(r));
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaTicketSoporteRepository -findAbiertosByCliente',
      );
    }
  }

  async findAbiertosByTecnico(tecnicoId: number): Promise<TicketSoporte[]> {
    try {
      const rows = await this.prisma.ticketSoporte.findMany({
        where: { tecnicoId, estado: 'ABIERTA' },
        orderBy: { fechaApertura: 'desc' },
      });
      return rows.map((r) => this.toDomain(r));
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaTicketSoporteRepository -findAbiertosByTecnico',
      );
    }
  }

  async findByEmpresa(params: {
    empresaId: number;
    estado?: string;
    prioridad?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const { empresaId, estado, prioridad, page = 1, limit = 20 } = params;
      const skip = (page - 1) * limit;

      const where: any = { empresaId };
      if (estado) where.estado = estado;
      if (prioridad) where.prioridad = prioridad;

      const [rows, total] = await Promise.all([
        this.prisma.ticketSoporte.findMany({
          where,
          skip,
          take: limit,
          orderBy: { fechaApertura: 'desc' },
        }),
        this.prisma.ticketSoporte.count({ where }),
      ]);

      return {
        items: rows.map((r) => this.toDomain(r)),
        total,
        page,
        limit,
      };
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaTicketSoporteRepository -findByEmpresa',
      );
    }
  }

  async obtenerTiempoTotalTrabajado(ticketId: number): Promise<number> {
    const result = await this.prisma.ticketTimeLog.aggregate({
        where: { ticketId },
        _sum: {
            duracionMinutos: true
        }
    });
    return result._sum.duracionMinutos || 0;
}

}
