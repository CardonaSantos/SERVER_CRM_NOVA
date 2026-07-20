import { ClienteDesinstalacionAutorizacionEntity } from '../domain/entities/cliente-desintalacion-autorizacion.entitie';
import { AutorizacionDesinstalacionPendiente } from '../domain/ports/cliente-desinstalacion-autorizacion.repository.port';
import { ClienteDesinstalacionPresenter } from './cliente-desinstalacion.presenter';
import { ClienteDesinstalacionEntity } from '../domain/entities/cliente-desinstalacion.entitie';

export class ClienteDesinstalacionAutorizacionPresenter {
  static toHttp(entity: ClienteDesinstalacionAutorizacionEntity) {
    const props = entity.toPrimitives();

    return {
      id: props.id,
      desinstalacionId: props.desinstalacionId,

      solicitadoPorId: props.solicitadoPorId,
      autorizadoPorId: props.autorizadoPorId,

      estado: props.estado,

      motivoSolicitud: props.motivoSolicitud,
      comentarioAutorizador: props.comentarioAutorizador,

      fechaSolicitud: props.fechaSolicitud,
      fechaRespuesta: props.fechaRespuesta,
    };
  }

  static pendienteToHttp(item: AutorizacionDesinstalacionPendiente) {
    return {
      autorizacion: this.toHttp(item.autorizacion),
      desinstalacion: item.desinstalacion,
    };
  }

  static pendientesToHttp(items: AutorizacionDesinstalacionPendiente[]) {
    return {
      data: items.map((item) => this.pendienteToHttp(item)),
      meta: {
        total: items.length,
      },
    };
  }

  static respuestaToHttp(result: {
    autorizacion: ClienteDesinstalacionAutorizacionEntity;
    desinstalacion: ClienteDesinstalacionEntity;
  }) {
    return {
      autorizacion: this.toHttp(result.autorizacion),
      desinstalacion: ClienteDesinstalacionPresenter.toHttp(
        result.desinstalacion,
      ),
    };
  }
}
