import { Prisma, Credito as PrismaCredito } from '@prisma/client';
import Decimal from 'decimal.js';
import { Credito } from '../entities/credito.entity';

export class CreditoMapper {
  static toPersistence(credito: Credito): Prisma.CreditoUncheckedCreateInput {
    return {
      id: credito.getId() ?? undefined,
      clienteId: credito.getClienteId(),

      montoCapital: new Prisma.Decimal(credito.getMontoCapital().toString()),
      interesPorcentaje: new Prisma.Decimal(
        credito.getInteresPorcentaje().toString(),
      ),

      interesMoraPorcentaje: new Prisma.Decimal(
        credito.getInteresMoraPorcentaje().toString(),
      ),

      engancheMonto: new Prisma.Decimal(credito.getEngancheMonto().toString()),

      interesTipo: credito.getInteresTipo(),
      plazoCuotas: credito.getPlazoCuotas(),
      frecuencia: credito.getFrecuencia(),
      intervaloDias: credito.getIntervaloDias(),

      montoTotal: new Prisma.Decimal(credito.getMontoTotal().toString()),
      montoCuota: new Prisma.Decimal(credito.getMontoCuota().toString()),

      estado: credito.getEstado(),
      fechaInicio: credito.getFechaInicio(),
      fechaFinEstimada: credito.getFechaFinEstimada(),

      origenCredito: credito.getOrigenCredito(),
      observaciones: credito.getObservaciones(),

      creadoPorId: credito.getCreadoPorId(),
    };
  }

  static toDomain(record: PrismaCredito): Credito {
    return Credito.rehidratar({
      id: record.id,
      clienteId: record.clienteId,

      montoCapital: new Decimal(record.montoCapital.toString()),
      interesPorcentaje: new Decimal(record.interesPorcentaje.toString()),
      interesMoraPorcentaje: new Decimal(
        record.interesMoraPorcentaje.toString(),
      ),

      engancheMonto: new Decimal(record.engancheMonto.toString()),

      interesTipo: record.interesTipo,

      plazoCuotas: record.plazoCuotas,
      frecuencia: record.frecuencia,
      intervaloDias: record.intervaloDias,

      montoTotal: new Decimal(record.montoTotal.toString()),
      montoCuota: new Decimal(record.montoCuota.toString()),

      estado: record.estado,
      fechaInicio: record.fechaInicio,
      fechaFinEstimada: record.fechaFinEstimada,

      origenCredito: record.origenCredito,
      observaciones: record.observaciones ?? undefined,
      creadoPorId: record.creadoPorId ?? undefined,
    });
  }
}
