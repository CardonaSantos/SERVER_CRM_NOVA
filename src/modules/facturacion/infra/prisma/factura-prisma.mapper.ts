import { Prisma, StateFacturaInternet } from '@prisma/client';
import { FacturaEntity } from '../../domain/entities/factura.entity';
import { EstadoFactura } from '../../domain/enums/estado-factura.enum';

export const CON_PAGOS = {
  pagos: { select: { id: true, montoPagado: true, fechaPago: true } },
} satisfies Prisma.FacturaInternetInclude;

export type FacturaConPagos = Prisma.FacturaInternetGetPayload<{
  include: typeof CON_PAGOS;
}>;

export class FacturaPrismaMapper {
  static toDomain(record: FacturaConPagos): FacturaEntity {
    return FacturaEntity.hydrate(
      {
        id: record.id,
        empresaId: record.empresaId,
        clienteId: record.clienteId,
        facturacionZonaId: record.facturacionZonaId,
        periodo: record.periodo,
        montoPago: record.montoPago ?? 0,
        saldoPendiente: record.saldoPendiente ?? 0,
        estado: record.estadoFacturaInternet as string as EstadoFactura,
        fechaPagoEsperada: record.fechaPagoEsperada,
        fechaPagada: record.fechaPagada,
        detalleFactura: record.detalleFactura,
        nombreClienteFactura: record.nombreClienteFactura,
        creadorId: record.creadorId,
        creadoEn: record.creadoEn,
        actualizadoEn: record.actualizadoEn,
      },
      record.pagos.map((pago) => ({
        id: pago.id,
        monto: pago.montoPagado,
        fecha: pago.fechaPago,
      })),
    );
  }

  static toCreatePersistence(
    entity: FacturaEntity,
  ): Prisma.FacturaInternetUncheckedCreateInput {
    const p = entity.toPrimitives();

    return {
      ...FacturaPrismaMapper.toUpdatePersistence(entity),
      empresaId: p.empresaId,
      clienteId: p.clienteId,
      facturacionZonaId: p.facturacionZonaId,
      periodo: p.periodo,
      nombreClienteFactura: p.nombreClienteFactura,
      creadorId: p.creadorId,
      creadoEn: p.creadoEn,
    };
  }

  /** Solo lo que cambia después de emitida. */
  static toUpdatePersistence(entity: FacturaEntity) {
    const p = entity.toPrimitives();

    return {
      montoPago: p.montoPago,
      saldoPendiente: p.saldoPendiente,
      estadoFacturaInternet: FacturaPrismaMapper.estado(p.estado),
      fechaPagoEsperada: p.fechaPagoEsperada,
      fechaPagada: p.fechaPagada,
      detalleFactura: p.detalleFactura,
      actualizadoEn: p.actualizadoEn,
    };
  }

  static estado(estado: EstadoFactura): StateFacturaInternet {
    return estado as string as StateFacturaInternet;
  }
}
