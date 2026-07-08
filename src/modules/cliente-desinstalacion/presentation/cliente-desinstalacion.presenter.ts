import { ClienteDesinstalacionEntity } from '../domain/entities/cliente-desinstalacion.entitie';
import { ClienteDesInstalacionPaginatedResult } from '../domain/ports/cliente-desinstalacion.repository.port';

export class ClienteDesinstalacionPresenter {
  static toHttp(entity: ClienteDesinstalacionEntity) {
    const props = entity.toPrimitives();

    return {
      id: props.id,

      empresaId: props.empresaId,
      clienteId: props.clienteId,

      servicioInternetId: props.servicioInternetId,
      ticketId: props.ticketId,

      solicitadoPorId: props.solicitadoPorId,
      ejecutadoPorId: props.ejecutadoPorId,
      creadoPorId: props.creadoPorId,

      tipo: props.tipo,
      motivo: props.motivo,
      estado: props.estado,

      fechaSolicitud: props.fechaSolicitud,
      fechaProgramada: props.fechaProgramada,
      fechaInicio: props.fechaInicio,
      fechaFinalizacion: props.fechaFinalizacion,
      fechaCancelacion: props.fechaCancelacion,

      requiereRetiroEquipo: props.requiereRetiroEquipo,
      equipoRecuperado: props.equipoRecuperado,

      costos: {
        saldoClienteAlMomento: props.saldoClienteAlMomento.toNumber(),
        costoDesinstalacion: props.costoDesinstalacion.toNumber(),
        costoTransporte: props.costoTransporte.toNumber(),
        costoManoObra: props.costoManoObra.toNumber(),
        costoOtros: props.costoOtros.toNumber(),
      },

      direccionServicio: props.direccionServicio,
      referenciaUbicacion: props.referenciaUbicacion,
      latitud: props.latitud,
      longitud: props.longitud,

      firmadoPor: props.firmadoPor,
      dpiFirmante: props.dpiFirmante,
      conforme: props.conforme,

      observaciones: props.observaciones,
      resultado: props.resultado,
      metadata: props.metadata,

      creadoEn: props.creadoEn,
      actualizadoEn: props.actualizadoEn,
    };
  }

  static paginatedToHttp(result: ClienteDesInstalacionPaginatedResult) {
    return {
      data: result.items.map((item) => this.toHttp(item)),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }
}
