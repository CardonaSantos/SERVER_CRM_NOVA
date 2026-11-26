import { TecnicoDesinstalacionResumen } from '../../domain/read-models/cliente-desinstalacion-resumen.read-model';

export class ClienteDesinstalacionTecnicoPresenter {
  static toHttp(tecnico: TecnicoDesinstalacionResumen) {
    return {
      id: tecnico.id,
      desinstalacionId: tecnico.desinstalacionId,
      tecnicoId: tecnico.tecnicoId,
      rol: tecnico.rol,
      esResponsable: tecnico.esResponsable,
      tiempoMinutos: tecnico.tiempoMinutos,
      observaciones: tecnico.observaciones,
      tecnicoNombreSnapshot: tecnico.tecnicoNombreSnapshot,
      creadoEn: tecnico.creadoEn,
      actualizadoEn: tecnico.actualizadoEn,
    };
  }

  static lista(tecnicos: TecnicoDesinstalacionResumen[]) {
    return {
      data: tecnicos.map((tecnico) => this.toHttp(tecnico)),
      meta: { total: tecnicos.length },
    };
  }
}
