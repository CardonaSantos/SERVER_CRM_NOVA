import { ClienteDesinstalacion, Prisma } from '@prisma/client';
import { Money } from 'src/shared/domain/value-objects/money.vo';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';
import { EstadoDesinstalacionCliente } from '../../domain/enums/estado-desinstalacion-cliente.enum';
import { MotivoDesinstalacionCliente } from '../../domain/enums/motivo-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../../domain/enums/tipo-desinstalacion-cliente.enum';

export class ClienteDesinstalacionPrismaMapper {
  /**
   * RECIBE UN REGISTRO DE PRISMA Y PASA A ENTIDAD
   */
  static toDomain(record: ClienteDesinstalacion): ClienteDesinstalacionEntity {
    return ClienteDesinstalacionEntity.hydrate({
      id: record.id,

      empresaId: record.empresaId,
      clienteId: record.clienteId,

      servicioInternetId: record.servicioInternetId,
      ticketId: record.ticketId,

      solicitadoPorId: record.solicitadoPorId,
      ejecutadoPorId: record.ejecutadoPorId,
      creadoPorId: record.creadoPorId,

      tipo: record.tipo as TipoDesinstalacionCliente,
      motivo: record.motivo as MotivoDesinstalacionCliente | null,
      estado: record.estado as EstadoDesinstalacionCliente,

      fechaSolicitud: record.fechaSolicitud,
      fechaProgramada: record.fechaProgramada,
      fechaInicio: record.fechaInicio,
      fechaFinalizacion: record.fechaFinalizacion,
      fechaCancelacion: record.fechaCancelacion,

      requiereRetiroEquipo: record.requiereRetiroEquipo,
      equipoRecuperado: record.equipoRecuperado,

      saldoClienteAlMomento: Money.fromString(
        record.saldoClienteAlMomento.toString(),
      ),
      costoDesinstalacion: Money.fromString(
        record.costoDesinstalacion.toString(),
      ),
      costoTransporte: Money.fromString(record.costoTransporte.toString()),
      costoManoObra: Money.fromString(record.costoManoObra.toString()),
      costoOtros: Money.fromString(record.costoOtros.toString()),

      direccionServicio: record.direccionServicio,
      referenciaUbicacion: record.referenciaUbicacion,
      latitud: record.latitud,
      longitud: record.longitud,

      firmadoPor: record.firmadoPor,
      dpiFirmante: record.dpiFirmante,
      conforme: record.conforme,

      observaciones: record.observaciones,
      resultado: record.resultado,
      metadata: record.metadata ?? undefined,

      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
    });
  }

  /**
   * RECIBE UNA ENTIDAD Y PASA A UN OBJ DE PRISMA PARA CREATE
   */
  static toCreatePersistence(
    entity: ClienteDesinstalacionEntity,
  ): Prisma.ClienteDesinstalacionUncheckedCreateInput {
    const props = entity.toPrimitives();

    return {
      empresaId: props.empresaId,
      clienteId: props.clienteId,

      servicioInternetId: props.servicioInternetId ?? null,
      ticketId: props.ticketId ?? null,

      solicitadoPorId: props.solicitadoPorId ?? null,
      ejecutadoPorId: props.ejecutadoPorId ?? null,
      creadoPorId: props.creadoPorId ?? null,

      tipo: props.tipo,
      motivo: props.motivo ?? null,
      estado: props.estado,

      fechaSolicitud: props.fechaSolicitud ?? null,
      fechaProgramada: props.fechaProgramada ?? null,
      fechaInicio: props.fechaInicio ?? null,
      fechaFinalizacion: props.fechaFinalizacion ?? null,
      fechaCancelacion: props.fechaCancelacion ?? null,

      requiereRetiroEquipo: props.requiereRetiroEquipo,
      equipoRecuperado: props.equipoRecuperado,

      saldoClienteAlMomento: props.saldoClienteAlMomento.toString(),
      costoDesinstalacion: props.costoDesinstalacion.toString(),
      costoTransporte: props.costoTransporte.toString(),
      costoManoObra: props.costoManoObra.toString(),
      costoOtros: props.costoOtros.toString(),

      direccionServicio: props.direccionServicio ?? null,
      referenciaUbicacion: props.referenciaUbicacion ?? null,
      latitud: props.latitud ?? null,
      longitud: props.longitud ?? null,

      firmadoPor: props.firmadoPor ?? null,
      dpiFirmante: props.dpiFirmante ?? null,
      conforme: props.conforme ?? null,

      observaciones: props.observaciones ?? null,
      resultado: props.resultado ?? null,

      metadata:
        props.metadata === undefined
          ? undefined
          : (props.metadata as Prisma.InputJsonValue),
    };
  }

  /**
   * RECIBE UNA ENTIDAD Y PASA A UN OBJ DE PRISMA PARA UPDATE
   */
  static toUpdatePersistence(
    entity: ClienteDesinstalacionEntity,
  ): Prisma.ClienteDesinstalacionUncheckedUpdateInput {
    const props = entity.toPrimitives();

    return {
      empresaId: props.empresaId,
      clienteId: props.clienteId,

      servicioInternetId: props.servicioInternetId ?? null,
      ticketId: props.ticketId ?? null,

      solicitadoPorId: props.solicitadoPorId ?? null,
      ejecutadoPorId: props.ejecutadoPorId ?? null,
      creadoPorId: props.creadoPorId ?? null,

      tipo: props.tipo,
      motivo: props.motivo ?? null,
      estado: props.estado,

      fechaSolicitud: props.fechaSolicitud ?? null,
      fechaProgramada: props.fechaProgramada ?? null,
      fechaInicio: props.fechaInicio ?? null,
      fechaFinalizacion: props.fechaFinalizacion ?? null,
      fechaCancelacion: props.fechaCancelacion ?? null,

      requiereRetiroEquipo: props.requiereRetiroEquipo,
      equipoRecuperado: props.equipoRecuperado,

      saldoClienteAlMomento: props.saldoClienteAlMomento.toString(),
      costoDesinstalacion: props.costoDesinstalacion.toString(),
      costoTransporte: props.costoTransporte.toString(),
      costoManoObra: props.costoManoObra.toString(),
      costoOtros: props.costoOtros.toString(),

      direccionServicio: props.direccionServicio ?? null,
      referenciaUbicacion: props.referenciaUbicacion ?? null,
      latitud: props.latitud ?? null,
      longitud: props.longitud ?? null,

      firmadoPor: props.firmadoPor ?? null,
      dpiFirmante: props.dpiFirmante ?? null,
      conforme: props.conforme ?? null,

      observaciones: props.observaciones ?? null,
      resultado: props.resultado ?? null,

      metadata:
        props.metadata === undefined
          ? undefined
          : (props.metadata as Prisma.InputJsonValue),
    };
  }
}
