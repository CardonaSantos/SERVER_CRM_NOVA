import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreditoRepository } from '../domain/credito.repository';
import { Credito } from '../entities/credito.entity';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreditoMapper } from './toPersistence';
import { Prisma } from '@prisma/client';
import { GetCreditosQueryDto } from '../dto/get-creditos-query.dto';

@Injectable()
export class PrismaCreditoRepository implements CreditoRepository {
  private readonly logger = new Logger(PrismaCreditoRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async save(credito: Credito): Promise<Credito> {
    try {
      const data = CreditoMapper.toPersistence(credito);

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

      if (!record) throw new NotFoundException('Error al encontrar registro');

      const rawRegistro = await this.findAll({
        search: id.toString(),
      });

      const registro = rawRegistro.data[0];
      return registro;
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

  async findAll(query: GetCreditosQueryDto): Promise<{
    data: Credito[];
    meta: { total: number; page: number; lastPage: number };
  }> {
    try {
      const { page = 1, limit = 10, search, estado } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.CreditoWhereInput = {};

      const conditions: Prisma.CreditoWhereInput[] = [];

      if (estado) {
        conditions.push({ estado });
      }

      if (search) {
        const searchConditions: Prisma.CreditoWhereInput[] = [
          {
            cliente: {
              nombre: { contains: search, mode: 'insensitive' },
            },
          },
          {
            cliente: {
              apellidos: { contains: search, mode: 'insensitive' },
            },
          },
        ];

        if (!isNaN(Number(search))) {
          searchConditions.push({ id: Number(search) });
        }

        conditions.push({ OR: searchConditions });
      }

      if (conditions.length > 0) {
        where.AND = conditions;
      }

      const [total, records] = await this.prisma.$transaction([
        this.prisma.credito.count({ where }),
        this.prisma.credito.findMany({
          where,
          skip,
          take: limit,
          orderBy: { creadoEn: 'desc' },

          include: {
            cuotas: {
              orderBy: { numeroCuota: 'asc' },
            },
            pagos: {
              include: {
                aplicaciones: true,
              },
              orderBy: { fechaPago: 'desc' },
            },
            cliente: {
              select: { nombre: true, apellidos: true },
            },
            creadoPor: {
              select: { nombre: true },
            },
          },
        }),
      ]);

      const lastPage = Math.ceil(total / limit);

      return {
        data: records.map((record) => CreditoMapper.toDomain(record)),
        meta: {
          total,
          page,
          lastPage,
        },
      };
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaCreditoRepository.findAll');
      throw error;
    }
  }

  async deleteAll(): Promise<number> {
    try {
      const creditosToDelete = await this.prisma.credito.deleteMany({});
      return creditosToDelete.count;
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaCreditoRepository.deleteAll');
    }
  }
}
