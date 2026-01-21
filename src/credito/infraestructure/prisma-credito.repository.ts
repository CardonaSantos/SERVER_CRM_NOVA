import { Logger } from '@nestjs/common';
import { CreditoRepository } from '../domain/credito.repository';
import { Credito } from '../entities/credito.entity';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyProps } from 'src/Utils/verifyProps';
import { CreditoMapper } from './toPersistence';

export class PrismaCreditoRepository implements CreditoRepository {
  private readonly logger = new Logger(PrismaCreditoRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async save(credito: Credito): Promise<Credito> {
    try {
      const data = CreditoMapper.toPersistence(credito);
      //   si viene con id es una actualizacion, sino create
      const record = credito.getId()
        ? await this.prisma.credito.update({
            where: { id: credito.getId() },
            data,
          })
        : await this.prisma.credito.create({
            data,
          });

      return CreditoMapper.toDomain(record);
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaCreditoRepository.save');
    }
  }

  async findById(id: number): Promise<Credito | null> {
    try {
      const record = await this.prisma.credito.findUnique({
        where: {
          id,
        },
      });

      return CreditoMapper.toDomain(record);
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaCreditoRepository.findById');
    }
  }

  async findByCliente(clienteId: number): Promise<Credito[]> {
    try {
      const records = await this.prisma.credito.findMany({
        where: {
          id: clienteId,
        },
      });

      return records.map((r) => CreditoMapper.toDomain(r));
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaCreditoRepository.findByCliente',
      );
    }
  }

  async existsActiveByCliente(clienteId: number): Promise<boolean> {
    try {
      const records = await this.prisma.credito.findMany({
        where: {
          clienteId,
        },
      });

      const hasActiveCredit = records.some((cr) => cr.estado === 'ACTIVO');
      return hasActiveCredit;
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaCreditoRepository.existsActiveByCliente',
      );
    }
  }

  async findMany(): Promise<Array<Credito>> {
    try {
      const records = await this.prisma.credito.findMany({});
      return records.map((r) => CreditoMapper.toDomain(r));
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaCreditoRepository.findMany');
    }
  }
}
