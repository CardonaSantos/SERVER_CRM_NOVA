import { CrearClienteDesinstalacionResult } from '../application/use-cases/crear-desinstalacion.use-case';
import { ClienteDesinstalacionEntity } from '../domain/entities/cliente-desinstalacion.entitie';
import {
  ClienteDesinstalacionDetalle,
  ClienteDesInstalacionPaginatedResult,
} from '../domain/ports/cliente-desinstalacion.repository.port';
import { ClienteDesinstalacionTecnicoPresenter } from './cliente-desinstalacion-tecnico.presenter';

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

  static detalleToHttp(detalle: ClienteDesinstalacionDetalle) {
    return {
      ...this.toHttp(detalle.desinstalacion),

      tecnicos: detalle.tecnicos.map((tecnico) =>
        ClienteDesinstalacionTecnicoPresenter.toHttp(tecnico),
      ),
    };
  }

  static paginatedToHttp(result: ClienteDesInstalacionPaginatedResult) {
    return {
      data: result.items.map((item) => this.detalleToHttp(item)),

      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  static crearToHttp(result: CrearClienteDesinstalacionResult) {
    return {
      ...this.toHttp(result.desinstalacion),

      tecnicos: result.tecnicos.map((tecnico) =>
        ClienteDesinstalacionTecnicoPresenter.toHttp(tecnico),
      ),
    };
  }
}
