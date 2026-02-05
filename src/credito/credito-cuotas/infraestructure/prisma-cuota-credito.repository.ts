import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CuotaCreditoRepository } from 'src/credito/credito-cuotas/domain/credito-cuota.repository';
import { CreateCuotaCustomDto } from 'src/credito/credito-cuotas/dto/create-cuota-custom.dto';
import { CuotaCredito } from 'src/credito/credito-cuotas/entities/credito-cuota.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { throwFatalError } from 'src/Utils/CommonFatalError';

// SETUP DAYJS
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import { Decimal } from '@prisma/client/runtime/library';
import { CREDITO } from 'src/credito/domain/credito.repository';
import { CuotaCreditoMapper } from 'src/credito/credito-cuotas/infraestructure/cuota-credito.mapper.ts';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('America/Guatemala');

interface CuotaCreate {
  creditoId: number;
  fechaVencimiento: Date;
  montoCapital: Decimal;
  posicion: number;
}

@Injectable()
export class PrismaCuotaCreditoRepository implements CuotaCreditoRepository {
  private readonly logger = new Logger(PrismaCuotaCreditoRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CuotaCredito): Promise<Array<CuotaCredito>> {
    try {
      const credito = await this.prisma.credito.findUnique({
        where: {
          id: dto.getCreditoId(),
        },
      });

      if (!credito) {
        throw new NotFoundException('Error al encontrar registro');
      }

      const arrayCuotasCredito = [];
      let posicion = 1;
      let fechaVencimiento = dayjs(credito.fechaInicio)
        .tz('America/Guatemala')
        .toDate();

      const enganche = credito.engancheMonto ?? new Decimal(0);
      const capitalFinalciado = credito.montoCapital.minus(enganche);

      for (let index = 0; index < credito.plazoCuotas; index++) {
        const cuota: CuotaCreate = {
          creditoId: credito.id,
          fechaVencimiento: fechaVencimiento,
          montoCapital: capitalFinalciado,
          posicion: posicion,
        };
        posicion++;
        fechaVencimiento = dayjs(fechaVencimiento)
          .add(credito.intervaloDias, 'day')
          .toDate();
        arrayCuotasCredito.push(cuota);
      }

      const newCuotasCredito = await this.prisma.cuotaCredito.createMany({
        data: arrayCuotasCredito,
      });

      const newCuotas = await this.prisma.cuotaCredito.findMany({
        where: {
          creditoId: credito.id,
        },
      });

      return newCuotas.map((c) => CuotaCreditoMapper.toDomain(c));
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaCuotaCreditoRepository.create',
      );
    }
  }

  async createCuota(dto: CuotaCreate) {
    const cuota = await this.prisma.cuotaCredito.create({
      data: {
        credito: {
          connect: {
            id: dto.creditoId,
          },
        },
        estado: 'PENDIENTE',
        fechaVenc: dto.fechaVencimiento,
        montoCapital: dto.montoCapital,
        numeroCuota: dto.posicion,
        montoTotal: dto.montoCapital,
        montoInteres: 0,
      },
    });
    return cuota;
  }

  async createCuotaCreditoCustom(
    dto: CreateCuotaCustomDto,
    creditoId: number,
  ): Promise<Array<CuotaCredito>> {
    try {
      for (const cuota of dto.cuotas) {
        await this.prisma.cuotaCredito.create({
          data: {
            estado: 'PENDIENTE',
            fechaVenc: cuota.fechaVencimiento,
            montoCapital: cuota.montoCapital,
            montoInteres: cuota.montoInteres,
            numeroCuota: cuota.numeroCuota,
            montoTotal: 1,
            credito: {
              connect: {
                id: creditoId,
              },
            },
          },
        });

        const cuotas = await this.prisma.cuotaCredito.findMany({
          where: {
            creditoId,
          },
        });

        return cuotas.map((c) => CuotaCredito.rehidratar(c));
      }
    } catch (error) {
      throwFatalError(error, this.logger, 'createCuotaCreditoCustom.create');
    }
  }

  async saveMany(cuotas: CuotaCredito[]) {
    await this.prisma.cuotaCredito.createMany({
      data: cuotas.map(CuotaCreditoMapper.toPersistence),
    });
  }
}
