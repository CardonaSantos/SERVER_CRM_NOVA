import {
  presentarPaginado,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { AutorizacionDesinstalacionPendiente } from '../../domain/read-models/autorizacion-desinstalacion-pendiente.read-model';
import {
  AutorizacionDesinstalacionResumen,
  ClienteDesinstalacionResumen,
} from '../../domain/read-models/cliente-desinstalacion-resumen.read-model';
import { ClienteDesinstalacionPresenter } from './cliente-desinstalacion.presenter';

export class ClienteDesinstalacionAutorizacionPresenter {
  static toHttp(autorizacion: AutorizacionDesinstalacionResumen) {
    return {
      id: autorizacion.id,
      desinstalacionId: autorizacion.desinstalacionId,
      solicitadoPorId: autorizacion.solicitadoPorId,
      autorizadoPorId: autorizacion.autorizadoPorId,
      estado: autorizacion.estado,
      motivoSolicitud: autorizacion.motivoSolicitud,
      comentarioAutorizador: autorizacion.comentarioAutorizador,
      fechaSolicitud: autorizacion.fechaSolicitud,
      fechaRespuesta: autorizacion.fechaRespuesta,
    };
  }

  static pendienteToHttp(item: AutorizacionDesinstalacionPendiente) {
    const { servicioInternet, cliente, ...resto } = item.desinstalacion;

    return {
      autorizacion: this.toHttp(item.autorizacion),
      solicitadoPor: item.solicitadoPor && {
        id: item.solicitadoPor.id,
        nombre: item.solicitadoPor.nombre,
      },
      desinstalacion: {
        ...resto,
        cliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          apellidos: cliente.apellidos,
          telefono: cliente.telefono,
          direccion: cliente.direccion,
        },
        servicioInternet: servicioInternet && {
          id: servicioInternet.id,
          nombre: servicioInternet.nombre,
          velocidad: servicioInternet.velocidad,
          precio: servicioInternet.precio,
        },
      },
    };
  }

  static pendientes(
    resultado: ResultadoPaginado<AutorizacionDesinstalacionPendiente>,
  ) {
    return presentarPaginado(resultado, (item) => this.pendienteToHttp(item));
  }

  static respuestaToHttp(resultado: {
    autorizacion: AutorizacionDesinstalacionResumen;
    desinstalacion: ClienteDesinstalacionResumen;
  }) {
    return {
      autorizacion: this.toHttp(resultado.autorizacion),
      desinstalacion: ClienteDesinstalacionPresenter.toHttp(
        resultado.desinstalacion,
      ),
    };
  }
}
