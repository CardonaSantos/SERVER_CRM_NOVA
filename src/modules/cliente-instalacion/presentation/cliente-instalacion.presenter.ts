import {
  ClienteInstalacionDetalle,
  ClienteInstalacionPaginatedResult,
} from '../domain/ports/cliente-instalacion.repository.port';
import { ClienteInstalacionEntity } from '../domain/entities/cliente-instalacion.entity';

export class ClienteInstalacionPresenter {
  static toHttp(entity: ClienteInstalacionEntity) {
    const props = entity.toPrimitives();

    return {
      id: props.id,
      empresaId: props.empresaId,
      clienteId: props.clienteId,

      servicioInternetId: props.servicioInternetId,
      ticketId: props.ticketId,

      asesorId: props.asesorId,
      creadoPorId: props.creadoPorId,
      completadoPorId: props.completadoPorId,

      tipo: props.tipo,
      estado: props.estado,

      fechaProgramada: props.fechaProgramada,
      fechaInicio: props.fechaInicio,
      fechaFinalizacion: props.fechaFinalizacion,
      fechaCancelacion: props.fechaCancelacion,
      fechaActivacionServicio: props.fechaActivacionServicio,

      motivo: props.motivo,
      observaciones: props.observaciones,
      resultado: props.resultado,

      direccionInstalacion: props.direccionInstalacion,
      referenciaUbicacion: props.referenciaUbicacion,
      latitud: props.latitud,
      longitud: props.longitud,

      ssidRouter: props.ssidRouter,

      costos: {
        costoInstalacion: props.costoInstalacion.toNumber(),
        costoMateriales: props.costoMateriales.toNumber(),
        costoManoObra: props.costoManoObra.toNumber(),
        costoOtros: props.costoOtros.toNumber(),
        montoCobradoCliente: props.montoCobradoCliente.toNumber(),
        saldoPendiente: props.saldoPendiente.toNumber(),
        notasCostos: props.notasCostos,
      },

      esMigrada: props.esMigrada,
      metadata: props.metadata,

      creadoEn: props.creadoEn,
      actualizadoEn: props.actualizadoEn,
    };
  }

  static paginatedToHttp(result: ClienteInstalacionPaginatedResult) {
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

  static detalleToHttp(detalle: ClienteInstalacionDetalle) {
    return {
      ...this.toHttp(detalle.instalacion),

      evidencias: detalle.evidencias.map((evidencia) => ({
        id: evidencia.id,
        instalacionId: evidencia.instalacionId,
        mediaId: evidencia.mediaId,
        tipo: evidencia.tipo,
        descripcion: evidencia.descripcion,
        orden: evidencia.orden,
        creadoEn: evidencia.creadoEn,
        media: {
          id: evidencia.media.id,
          cdnUrl: evidencia.media.cdnUrl,
          key: evidencia.media.key,
          mimeType: evidencia.media.mimeType,
          extension: evidencia.media.extension,
          tamanioBytes:
            evidencia.media.tamanioBytes != null
              ? evidencia.media.tamanioBytes.toString()
              : null,
        },
      })),
    };
  }
}
