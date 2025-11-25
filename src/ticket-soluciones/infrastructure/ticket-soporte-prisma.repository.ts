// infrastructure/ticket-solucion-prisma.repository.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { TicketSolucionRepository } from '../domain/ticket-solucion.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { SolucionTicket } from '../domain/ticket-soluciones.entity';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { UpdateTicketSolucioneDto } from '../dto/update-ticket-solucione.dto';
import { error } from 'console';
//LA INSFRAESTRUCTURA, DEBE SER GUIADA POR EL EXTENDS DE TICKETSOLUCIONREPOSITORY
@Injectable()
export class TicketSolucionRepositoryPrisma extends TicketSolucionRepository {
  private readonly logger = new Logger(TicketSolucionRepositoryPrisma.name);
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: number): Promise<SolucionTicket | null> {
    try {
      const record = await this.prisma.solucionTicket.findUnique({
        where: { id },
      });

      if (!record) return null;

      return new SolucionTicket({
        id: record.id,
        solucion: record.solucion,
        descripcion: record.descripcion ?? '',
        isEliminado: record.isEliminado,
      });
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Ticket Soporte Prisma Repository - create',
      );
    }
  }

  async create(ticket: SolucionTicket): Promise<SolucionTicket> {
    try {
      const record = await this.prisma.solucionTicket.create({
        data: {
          solucion: ticket.solucion,
          descripcion: ticket.descripcion,
          isEliminado: ticket.isEliminado,
        },
      });

      return new SolucionTicket({
        id: record.id,
        solucion: record.solucion,
        descripcion: record.descripcion ?? '',
        isEliminado: record.isEliminado,
      });
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Ticket Soporte Prisma Repository - create',
      );
    }
  }

  async deleteAll(): Promise<number | null> {
    try {
      const deleted = await this.prisma.solucionTicket.deleteMany();
      return deleted.count;
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Ticket Soporte Prisma Repository - deleteAll',
      );
    }
  }

  async deleteById(id: number): Promise<SolucionTicket | null> {
    try {
      const record = await this.prisma.solucionTicket.delete({
        where: {
          id,
        },
      });

      if (!record)
        throw new BadRequestException(
          `Registro de solucion ticket no encontrado, ID: ${id}`,
        );
      return record;
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Ticket Soporte Prisma Repository - deleteById',
      );
    }
  }

  async update(
    id: number,
    dto: UpdateTicketSolucioneDto,
  ): Promise<SolucionTicket | null> {
    try {
      const { descripcion, isEliminado, solucion } = dto;
      const recordToUpdate = await this.prisma.solucionTicket.update({
        where: {
          id: id,
        },
        data: {
          descripcion: descripcion,
          solucion: solucion,
          isEliminado: isEliminado,
        },
      });

      if (!recordToUpdate) throw error;
      return recordToUpdate;
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Ticket Soporte Prisma Repository - update',
      );
    }
  }

  async getAll(): Promise<SolucionTicket[] | null> {
    try {
      const records = await this.prisma.solucionTicket.findMany({});
      return records;
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Ticket Soporte Prisma Repository - update',
      );
    }
  }
}
