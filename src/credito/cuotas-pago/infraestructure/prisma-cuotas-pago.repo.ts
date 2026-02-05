import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CuotaPagoRepository } from '../domain/cuota-pago.repository';
import { CreateCuotasPagoDto } from '../dto/create-cuotas-pago.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { Credito } from 'src/credito/entities/credito.entity';
import { CuotaCredito } from 'src/credito/credito-cuotas/entities/credito-cuota.entity';
import Decimal from 'decimal.js';
import { EstadoCredito } from '@prisma/client';
// DAYJS
import * as dayjs from 'dayjs';
import 'dayjs/locale/es';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import { TZ } from 'src/Utils/tzgt';
import { CreditoMapper } from 'src/credito/infraestructure/toPersistence';
import { PayMoraCuotaDto } from '../dto/pay-mora-cuota.dto';
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('es');

@Injectable()
export class PrismaCuotasPago implements CuotaPagoRepository {
  private readonly logger = new Logger(PrismaCuotasPago.name);
  constructor(private readonly prisma: PrismaService) {}

  async persistirPago(params: {
    credito: Credito;
    cuota: CuotaCredito;
    monto: Decimal;
    dto: CreateCuotasPagoDto;
  }) {
    const fechaPago = params.dto.fechaPago
      ? dayjs(params.dto.fechaPago).tz(TZ).toDate()
      : new Date();

    return this.prisma.$transaction(async (tx) => {
      const pagoCredito = await tx.pagoCredito.create({
        data: {
          creditoId: params.credito.getId(),
          montoTotal: params.monto.toString(),
          fechaPago: fechaPago,
          metodoPago: params.dto.metodoPago,
          referencia: params.dto.referencia,
          observacion: params.dto.observacion,
          registradoPorId: params.dto.userId,
        },
      });

      await tx.pagoCuota.create({
        data: {
          cuotaId: params.cuota.getId(),
          pagoCreditoId: pagoCredito.id,
          monto: params.monto.toString(),
        },
      });

      await tx.cuotaCredito.update({
        where: { id: params.cuota.getId() },
        data: {
          montoPagado: params.cuota.getMontoPagado().toString(),
          estado: params.cuota.getEstado(),
        },
      });

      if (params.credito.getEstado() === EstadoCredito.COMPLETADO) {
        await tx.credito.update({
          where: { id: params.credito.getId() },
          data: { estado: EstadoCredito.COMPLETADO },
        });
      }
    });
  }

  async findByIdWithCuotas(id: number): Promise<Credito> {
    const record = await this.prisma.credito.findUnique({
      where: { id },
      include: {
        cuotas: {
          orderBy: { numeroCuota: 'asc' },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Crédito no encontrado');
    }

    return CreditoMapper.toDomain(record);
  }

  async persistirEliminacionPago(params: {
    credito: Credito;
    cuota: CuotaCredito;
    pagoCuotaId: number;
  }) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const pagoCuota = await tx.pagoCuota.findUnique({
          where: { id: params.pagoCuotaId },
        });

        if (!pagoCuota) {
          throw new Error('PagoCuota no encontrado');
        }

        const pagoCreditoId = pagoCuota.pagoCreditoId;

        await tx.pagoCuota.delete({
          where: { id: params.pagoCuotaId },
        });

        const aplicacionesRestantes = await tx.pagoCuota.count({
          where: { pagoCreditoId },
        });

        if (aplicacionesRestantes === 0) {
          await tx.pagoCredito.delete({
            where: { id: pagoCreditoId },
          });
        }

        await tx.cuotaCredito.update({
          where: { id: params.cuota.getId() },
          data: {
            montoPagado: params.cuota.getMontoPagado().toString(),
            estado: params.cuota.getEstado(),
          },
        });

        await tx.credito.update({
          where: { id: params.credito.getId() },
          data: {
            estado: params.credito.getEstado(),
          },
        });
      });
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaCuotasPago.persistirEliminacionPago',
      );
    }
  }

  async findByPagoCuotaId(pagoCuotaId: number): Promise<Credito> {
    const pagoCuota = await this.prisma.pagoCuota.findUnique({
      where: { id: pagoCuotaId },
      include: {
        cuota: {
          include: {
            credito: {
              include: {
                cuotas: {
                  orderBy: { numeroCuota: 'asc' },
                  include: {
                    pagos: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pagoCuota) {
      throw new NotFoundException('Pago no encontrado');
    }

    return CreditoMapper.toDomain(pagoCuota.cuota.credito);
  }

  async payMoraCuota(dto: PayMoraCuotaDto): Promise<void> {
    const { moraId, userId } = dto;

    await this.prisma.$transaction(async (tx) => {
      const mora = await tx.moraCredito.findUnique({
        where: { id: moraId },
        include: {
          cuota: {
            include: {
              moras: true,
            },
          },
        },
      });

      if (!mora) {
        throw new NotFoundException('Mora no encontrada');
      }

      if (mora.estado === 'PAGADA') {
        throw new BadRequestException('La mora ya está pagada');
      }

      await tx.moraCredito.update({
        where: { id: moraId },
        data: {
          estado: 'PAGADA',
          pagadoEn: new Date(),
          pagadoPorId: userId,
        },
      });

      const quedanMorasPendientes = mora.cuota.moras.some(
        (m) => m.estado === 'PENDIENTE' && m.id !== moraId,
      );

      if (!quedanMorasPendientes) {
        await tx.cuotaCredito.update({
          where: { id: mora.cuotaId },
          data: {
            estado: mora.cuota.montoPagado.eq(mora.cuota.montoTotal)
              ? 'PAGADA'
              : mora.cuota.montoPagado.gt(0)
                ? 'PARCIAL'
                : 'PENDIENTE',
          },
        });
      }
    });
  }
}
