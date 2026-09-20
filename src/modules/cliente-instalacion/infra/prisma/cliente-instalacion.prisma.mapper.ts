import { Prisma, ClienteInstalacion } from '@prisma/client';
import { Money } from 'src/shared/domain/value-objects/money.vo';
import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';
import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';
import { TipoInstalacionCliente } from '../../domain/enums/tipo-instalacion-cliente.enum';

export class ClienteInstalacionPrismaMapper {
  static toDomain(record: ClienteInstalacion): ClienteInstalacionEntity {
    return ClienteInstalacionEntity.hydrate({
      id: record.id,

      empresaId: record.empresaId,
      clienteId: record.clienteId,

      servicioInternetId: record.servicioInternetId,
      ticketId: record.ticketId,

      asesorId: record.asesorId,
      creadoPorId: record.creadoPorId,
      completadoPorId: record.completadoPorId,

      tipo: record.tipo as TipoInstalacionCliente,
      estado: record.estado as EstadoInstalacionCliente,

      fechaProgramada: record.fechaProgramada,
      fechaInicio: record.fechaInicio,
      fechaFinalizacion: record.fechaFinalizacion,
      fechaCancelacion: record.fechaCancelacion,
      fechaActivacionServicio: record.fechaActivacionServicio,

      descripcion: record.descripcion,
      motivo: record.motivo,
      observaciones: record.observaciones,
      resultado: record.resultado,

      direccionInstalacion: record.direccionInstalacion,
      referenciaUbicacion: record.referenciaUbicacion,
      latitud: record.latitud,
      longitud: record.longitud,

      costoInstalacion: Money.fromString(record.costoInstalacion.toString()),
      costoMateriales: Money.fromString(record.costoMateriales.toString()),
      costoManoObra: Money.fromString(record.costoManoObra.toString()),
      costoOtros: Money.fromString(record.costoOtros.toString()),
      montoCobradoCliente: Money.fromString(
        record.montoCobradoCliente.toString(),
      ),

      notasCostos: record.notasCostos,

      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
    });
  }

  static toCreatePersistence(
    entity: ClienteInstalacionEntity,
  ): Prisma.ClienteInstalacionUncheckedCreateInput {
    const props = entity.toPrimitives();

    return {
      empresaId: props.empresaId,
      clienteId: props.clienteId,

      servicioInternetId: props.servicioInternetId ?? null,
      ticketId: props.ticketId ?? null,

      asesorId: props.asesorId ?? null,
      creadoPorId: props.creadoPorId ?? null,
      completadoPorId: props.completadoPorId ?? null,

      tipo: props.tipo,
      estado: props.estado,

      fechaProgramada: props.fechaProgramada ?? null,
      fechaInicio: props.fechaInicio ?? null,
      fechaFinalizacion: props.fechaFinalizacion ?? null,
      fechaCancelacion: props.fechaCancelacion ?? null,
      fechaActivacionServicio: props.fechaActivacionServicio ?? null,

      descripcion: props.descripcion ?? null,
      motivo: props.motivo ?? null,
      observaciones: props.observaciones ?? null,
      resultado: props.resultado ?? null,

      direccionInstalacion: props.direccionInstalacion ?? null,
      referenciaUbicacion: props.referenciaUbicacion ?? null,
      latitud: props.latitud ?? null,
      longitud: props.longitud ?? null,

      costoInstalacion: props.costoInstalacion.toString(),
      costoMateriales: props.costoMateriales.toString(),
      costoManoObra: props.costoManoObra.toString(),
      costoOtros: props.costoOtros.toString(),
      montoCobradoCliente: props.montoCobradoCliente.toString(),

      notasCostos: props.notasCostos ?? null,
    };
  }

  static toUpdatePersistence(
    entity: ClienteInstalacionEntity,
  ): Prisma.ClienteInstalacionUncheckedUpdateInput {
    const props = entity.toPrimitives();

    return {
      empresaId: props.empresaId,
      clienteId: props.clienteId,

      servicioInternetId: props.servicioInternetId ?? null,
      ticketId: props.ticketId ?? null,

      asesorId: props.asesorId ?? null,
      creadoPorId: props.creadoPorId ?? null,
      completadoPorId: props.completadoPorId ?? null,

      tipo: props.tipo,
      estado: props.estado,

      fechaProgramada: props.fechaProgramada ?? null,
      fechaInicio: props.fechaInicio ?? null,
      fechaFinalizacion: props.fechaFinalizacion ?? null,
      fechaCancelacion: props.fechaCancelacion ?? null,
      fechaActivacionServicio: props.fechaActivacionServicio ?? null,

      descripcion: props.descripcion ?? null,
      motivo: props.motivo ?? null,
      observaciones: props.observaciones ?? null,
      resultado: props.resultado ?? null,

      direccionInstalacion: props.direccionInstalacion ?? null,
      referenciaUbicacion: props.referenciaUbicacion ?? null,
      latitud: props.latitud ?? null,
      longitud: props.longitud ?? null,

      costoInstalacion: props.costoInstalacion.toString(),
      costoMateriales: props.costoMateriales.toString(),
      costoManoObra: props.costoManoObra.toString(),
      costoOtros: props.costoOtros.toString(),
      montoCobradoCliente: props.montoCobradoCliente.toString(),

      notasCostos: props.notasCostos ?? null,
    };
  }
}
