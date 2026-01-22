import { Injectable } from '@nestjs/common';
import { Prisma, CuotaCredito as PrismaCuotaCredito } from '@prisma/client';
import Decimal from 'decimal.js';
import { CuotaCredito } from 'src/credito/credito-cuotas/entities/credito-cuota.entity';

export class CuotaCreditoMapper {
  /* ============================
   * DOMAIN → PERSISTENCE
   * ============================ */
  static toPersistence(
    cuota: CuotaCredito,
  ): Prisma.CuotaCreditoUncheckedCreateInput {
    return {
      id: cuota.getId() ?? undefined,
      creditoId: cuota.getCreditoId(),

      numeroCuota: cuota.getNumeroCuota(),
      fechaVenc: cuota.getFechaVenc(),

      montoCapital: new Prisma.Decimal(cuota.getMontoCapital().toString()),
      montoInteres: new Prisma.Decimal(cuota.getMontoInteres().toString()),
      montoTotal: new Prisma.Decimal(cuota.getMontoTotal().toString()),

      montoPagado: new Prisma.Decimal(cuota.getMontoPagado().toString()),

      estado: cuota.getEstado(),
    };
  }

  /* ============================
   * PERSISTENCE → DOMAIN
   * ============================ */
  static toDomain(record: PrismaCuotaCredito): CuotaCredito {
    return CuotaCredito.rehidratar({
      id: record.id,
      creditoId: record.creditoId,

      numeroCuota: record.numeroCuota,
      fechaVenc: record.fechaVenc,

      montoCapital: new Decimal(record.montoCapital.toString()),
      montoInteres: new Decimal(record.montoInteres.toString()),
      montoTotal: new Decimal(record.montoTotal.toString()),

      montoPagado: new Decimal(record.montoPagado.toString()),
      estado: record.estado,
    });
  }
}
