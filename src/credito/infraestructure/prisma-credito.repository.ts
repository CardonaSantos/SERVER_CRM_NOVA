import { Injectable, Logger } from '@nestjs/common';
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
      //   si viene con id es una actualizacion, sino create

      const capital = credito.getMontoCapital();
      const enganche = credito.getEngancheMonto();
      const cuotas = credito.getPlazoCuotas();

      const capitalWithEnganche = capital.minus(enganche ?? 0).div(cuotas);

      const record = credito.getId()
        ? await this.prisma.credito.update({
            where: { id: credito.getId() },
            data: {
              ...data,
              montoCapital: capitalWithEnganche,
            },
          })
        : await this.prisma.credito.create({
            data: {
              ...data,
              montoCapital: capitalWithEnganche,
            },
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

  async findAll(query: GetCreditosQueryDto): Promise<{
    data: Credito[];
    meta: { total: number; page: number; lastPage: number };
  }> {
    try {
      const { page = 1, limit = 10, search, estado } = query;
      const skip = (page - 1) * limit;

      // 1. Construir Filtros Dinámicos
      const where: Prisma.CreditoWhereInput = {};

      const conditions: Prisma.CreditoWhereInput[] = [];

      // Filtro por Estado
      if (estado) {
        conditions.push({ estado });
      }

      // Filtro por Búsqueda (ID o Cliente)
      if (search) {
        const searchConditions: Prisma.CreditoWhereInput[] = [
          // Buscar por nombre del cliente (case insensitive)
          {
            cliente: {
              nombre: { contains: search, mode: 'insensitive' },
            },
          },
          // Buscar por apellido del cliente
          {
            cliente: {
              apellidos: { contains: search, mode: 'insensitive' },
            },
          },
        ];

        // Si el search es un número, intentar buscar por ID exacto
        if (!isNaN(Number(search))) {
          searchConditions.push({ id: Number(search) });
        }

        conditions.push({ OR: searchConditions });
      }

      if (conditions.length > 0) {
        where.AND = conditions;
      }

      // 2. Ejecutar Transacción (Count + FindMany)
      const [total, records] = await this.prisma.$transaction([
        this.prisma.credito.count({ where }),

        this.prisma.credito.findMany({
          where,
          skip,
          take: limit,
          orderBy: { creadoEn: 'desc' }, // Ordenar: Más recientes primero

          // 3. INCLUIR RELACIONES (Eager Loading)
          include: {
            cuotas: {
              orderBy: { numeroCuota: 'asc' }, // Cuotas en orden 1,2,3...
            },
            // Pagos y sus detalles
            pagos: {
              include: {
                aplicaciones: true,
              },
              orderBy: { fechaPago: 'desc' },
            },
            // Datos básicos del cliente
            cliente: {
              select: { nombre: true, apellidos: true },
            },
            // Datos del creador
            creadoPor: {
              select: { nombre: true },
            },
          },
        }),
      ]);

      // 4. Calcular metadata y mapear
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
      throw error; // Necesario para TS si throwFatalError no retorna never
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
