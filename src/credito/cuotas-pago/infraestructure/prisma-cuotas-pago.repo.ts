import { Injectable, Logger } from '@nestjs/common';
import { CuotaPagoRepository } from '../domain/cuota-pago.repository';
import { CreateCuotasPagoDto } from '../dto/create-cuotas-pago.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { Credito } from 'src/credito/entities/credito.entity';
import { CuotaCredito } from 'src/credito/credito-cuotas/entities/credito-cuota.entity';
import Decimal from 'decimal.js';
import { EstadoCredito } from '@prisma/client';

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
    return this.prisma.$transaction(async (tx) => {
      const pagoCredito = await tx.pagoCredito.create({
        data: {
          creditoId: params.credito.getId(),
          montoTotal: params.monto.toString(),
          fechaPago: params.dto.fechaPago ?? new Date(),
          metodoPago: params.dto.metodoPago,
          referencia: params.dto.referencia,
          observacion: params.dto.observacion,
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
}
