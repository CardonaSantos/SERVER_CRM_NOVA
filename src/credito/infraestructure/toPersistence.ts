import {
  Prisma,
  Credito as PrismaCredito,
  CuotaCredito as PrismaCuotaCreditoModel, // <--- Importa el tipo de PRISMA, ponle alias para no confundir
} from '@prisma/client';
import Decimal from 'decimal.js';
import { Credito } from '../entities/credito.entity';
import { PrismaCuotaCreditoRepository } from '../credito-cuotas/infraestructure/prisma-cuota-credito.repository';
import { CuotaCreditoMapper } from '../credito-cuotas/infraestructure/cuota-credito.mapper.ts';

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

  static toDomain(
    record: PrismaCredito & {
      cuotas?: PrismaCuotaCreditoModel[];
      pagos?: any[];
      cliente?: { nombre: string; apellido?: string }; // Ajusta según tu modelo Cliente
      creadoPor?: { nombre: string };
    },
  ): Credito {
    const cuotasDomain = record.cuotas
      ? record.cuotas.map((c) => CuotaCreditoMapper.toDomain(c))
      : undefined;

    return Credito.rehidratar({
      id: record.id,
      clienteId: record.clienteId,
      montoCapital: new Decimal(record.montoCapital.toString()),
      interesPorcentaje: new Decimal(record.interesPorcentaje.toString()),
      interesMoraPorcentaje: new Decimal(
        record.interesMoraPorcentaje.toString(),
      ),
      engancheMonto: record.engancheMonto
        ? new Decimal(record.engancheMonto.toString())
        : new Decimal(0),
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

      relations: {
        cuotas: cuotasDomain,
        pagos: record.pagos,
        clienteNombre: record.cliente
          ? `${record.cliente.nombre} ${record.cliente.apellido ?? ''}`.trim()
          : undefined,
        usuarioNombre: record.creadoPor?.nombre,
      },
    });
  }
}
