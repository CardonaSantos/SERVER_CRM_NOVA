import { ClienteDesinstalacionTecnicoEntity } from '../domain/entities/cliente-desinstalacion-tecnico.entity';

export class ClienteDesinstalacionTecnicoPresenter {
  static toHttp(entity: ClienteDesinstalacionTecnicoEntity) {
    const props = entity.toPrimitives();

    return {
      id: props.id,
      desinstalacionId: props.desinstalacionId,
      tecnicoId: props.tecnicoId,

      rol: props.rol,
      esResponsable: props.esResponsable,

      tiempoMinutos: props.tiempoMinutos,
      observaciones: props.observaciones,
      tecnicoNombreSnapshot: props.tecnicoNombreSnapshot,

      creadoEn: props.creadoEn,
      actualizadoEn: props.actualizadoEn,
    };
  }

  static listToHttp(items: ClienteDesinstalacionTecnicoEntity[]) {
    return {
      data: items.map((item) => this.toHttp(item)),

      meta: {
        total: items.length,
      },
    };
  }
}
