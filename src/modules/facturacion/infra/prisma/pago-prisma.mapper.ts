import {
  MetodoPagoFacturaInternet,
  OrigenPago as OrigenPagoPrisma,
  PagoFacturaInternet,
  Prisma,
} from '@prisma/client';
import { PagoEntity } from '../../domain/entities/pago.entity';
import { MetodoPago } from '../../domain/enums/metodo-pago.enum';
import { OrigenPago } from '../../domain/enums/origen-pago.enum';

export class PagoPrismaMapper {
  static toDomain(record: PagoFacturaInternet): PagoEntity {
    return PagoEntity.hydrate({
      id: record.id,
      facturaId: record.facturaInternetId,
      clienteId: record.clienteId,
      montoPagado: record.montoPagado,
      metodoPago: record.metodoPago as string as MetodoPago,
      fechaPago: record.fechaPago,
      creadoEn: record.creadoEn,
      cobradorId: record.cobradorId,
      numeroBoleta: record.numeroBoleta,
      codigoConfirmacion: record.codigoConfirmacion,
      origen: record.origen as string as OrigenPago,
      rutaId: record.rutaId,
    });
  }

  static toCreatePersistence(
    entity: PagoEntity,
  ): Prisma.PagoFacturaInternetUncheckedCreateInput {
    const p = entity.toPrimitives();

    return {
      facturaInternetId: p.facturaId,
      clienteId: p.clienteId,
      montoPagado: p.montoPagado,
      metodoPago: PagoPrismaMapper.metodo(p.metodoPago),
      fechaPago: p.fechaPago,
      creadoEn: p.creadoEn,
      cobradorId: p.cobradorId,
      numeroBoleta: p.numeroBoleta,
      codigoConfirmacion: p.codigoConfirmacion,
      origen: PagoPrismaMapper.origen(p.origen),
      rutaId: p.rutaId,
    };
  }

  static metodo(metodo: MetodoPago): MetodoPagoFacturaInternet {
    return metodo as string as MetodoPagoFacturaInternet;
  }

  static origen(origen: OrigenPago): OrigenPagoPrisma {
    return origen as string as OrigenPagoPrisma;
  }
}
