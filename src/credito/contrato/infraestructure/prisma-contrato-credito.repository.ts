import { throwFatalError } from 'src/Utils/CommonFatalError';
import { ContratoCreditoRepository } from '../domain/contrato-credito.repository';
import { Contrato } from '../entities/contrato.entity';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ContratoMapper } from './contrato-credito-mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaContratoCredito implements ContratoCreditoRepository {
  private readonly logger = new Logger(PrismaContratoCredito.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(contrato: Contrato): Promise<Contrato> {
    try {
      const data = ContratoMapper.toPersistence(contrato);
      const newRecord = await this.prisma.creditoContrato.create({
        data: {
          contenido: data.contenido,
          version: data.version,
          firmadoEn: data.firmadoEn,
          credito: data.creditoId
            ? {
                connect: {
                  id: data.creditoId,
                },
              }
            : null,
        },
      });

      return ContratoMapper.toDomain(newRecord);
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaContratoCredito.create');
    }
  }

  async findById(id: number): Promise<Contrato> {
    try {
      const record = await this.prisma.creditoContrato.findUnique({
        where: { id },
      });

      if (!record)
        throw new NotFoundException(`Contrato con ID ${id} no encontrado`);

      return ContratoMapper.toDomain(record);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throwFatalError(error, this.logger, 'PrismaContratoCredito.findById');
    }
  }

  async deleteById(id: number): Promise<void> {
    try {
      await this.prisma.creditoContrato.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`No se pudo eliminar: ID ${id} no existe`);
      }
      throwFatalError(error, this.logger, 'PrismaContratoCredito.deleteById');
    }
  }

  async deleteAll(): Promise<number> {
    try {
      const result = await this.prisma.creditoContrato.deleteMany({});
      return result.count;
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaContratoCredito.deleteAll');
    }
  }

  async findMany(): Promise<Array<Contrato>> {
    try {
      const records = await this.prisma.creditoContrato.findMany({});

      if (!records) throw new NotFoundException(`No se encuentran registros`);

      return records.map((r) => ContratoMapper.toDomain(r));
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throwFatalError(error, this.logger, 'PrismaContratoCredito.findById');
    }
  }
}
