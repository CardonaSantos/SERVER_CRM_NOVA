import { ClienteInstalacionEntity } from '../domain/entities/cliente-instalacion.entity';
import { ClienteInstalacionPaginatedResult } from '../domain/ports/cliente-instalacion.repository.port';

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
}
