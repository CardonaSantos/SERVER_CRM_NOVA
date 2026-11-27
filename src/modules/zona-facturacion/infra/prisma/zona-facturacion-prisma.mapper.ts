import { FacturacionZona, Prisma } from '@prisma/client';
import { ZonaFacturacionEntity } from '../../domain/entities/zona-facturacion.entity';
import { ZonaFacturacionConfiguracion } from '../../domain/props/zona-facturacion.props';

export class ZonaFacturacionPrismaMapper {
  static toDomain(record: FacturacionZona): ZonaFacturacionEntity {
    return ZonaFacturacionEntity.hydrate({
      ...ZonaFacturacionPrismaMapper.configuracion(record),
      id: record.id,
      empresaId: record.empresaId,
      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
      eliminadoEn: record.eliminadoEn,
      eliminadoPorId: record.eliminadoPorId,
    });
  }

  static toCreatePersistence(
    entity: ZonaFacturacionEntity,
  ): Prisma.FacturacionZonaUncheckedCreateInput {
    const props = entity.toPrimitives();

    return {
      ...ZonaFacturacionPrismaMapper.configuracion(props),
      empresaId: props.empresaId,
      creadoEn: props.creadoEn,
      actualizadoEn: props.actualizadoEn,
    };
  }

  /** No incluye las columnas que el módulo no administra: se conservan. */
  static toUpdatePersistence(
    entity: ZonaFacturacionEntity,
  ): Prisma.FacturacionZonaUncheckedUpdateManyInput {
    const props = entity.toPrimitives();

    return {
      ...ZonaFacturacionPrismaMapper.configuracion(props),
      actualizadoEn: props.actualizadoEn,
    };
  }

  static configuracion(
    origen: ZonaFacturacionConfiguracion,
  ): ZonaFacturacionConfiguracion {
    return {
      nombre: origen.nombre,
      diaGeneracionFactura: origen.diaGeneracionFactura,
      diaPago: origen.diaPago,
      diaRecordatorio: origen.diaRecordatorio,
      diaSegundoRecordatorio: origen.diaSegundoRecordatorio,
      diaCorte: origen.diaCorte,
      suspenderTrasFacturas: origen.suspenderTrasFacturas,
      enviarRecordatorio: origen.enviarRecordatorio,
      enviarRecordatorioGeneracion: origen.enviarRecordatorioGeneracion,
      enviarAvisoPago: origen.enviarAvisoPago,
      enviarRecordatorio1: origen.enviarRecordatorio1,
      enviarRecordatorio2: origen.enviarRecordatorio2,
    };
  }
}
