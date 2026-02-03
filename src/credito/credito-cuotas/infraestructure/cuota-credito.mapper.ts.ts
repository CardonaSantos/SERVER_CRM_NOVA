import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { CuotaCredito } from 'src/credito/credito-cuotas/entities/credito-cuota.entity';

import {
  Prisma,
  CuotaCredito as PrismaCuotaCredito,
  PagoCuota as PrismaPagoCuota,
  MoraCredito as PrismaMoraCredito,
} from '@prisma/client';
import { PagoCuota } from 'src/credito/cuotas-pago/entities/cuotas-pago.entity';
import { MoraCuota } from '../entities/mora-cuota.entity';

type PrismaCuotaConPagos = PrismaCuotaCredito & {
  pagos?: PrismaPagoCuota[];
  moras?: PrismaMoraCredito[]; // <--- Importante
};

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
  static toDomain(record: PrismaCuotaConPagos): CuotaCredito {
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

      pagos: record.pagos
        ? record.pagos.map((p) =>
            PagoCuota.rehidratar({
              id: p.id,
              monto: new Decimal(p.monto.toString()),
              fechaPago: p.creadoEn,
              metodoPago: undefined,
              referencia: undefined,
              observacion: undefined,
            }),
          )
        : [],

      moras: record.moras
        ? record.moras.map((m) =>
            MoraCuota.rehidratar({
              id: m.id,
              diasMora: m.diasMora,
              interes: new Decimal(m.interes.toString()),
              calculadoEn: m.calculadoEn,
              estado: m.estado,
            }),
          )
        : [],
    });
  }
}
