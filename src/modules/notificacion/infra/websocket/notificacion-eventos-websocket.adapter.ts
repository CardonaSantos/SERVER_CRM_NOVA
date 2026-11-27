import { Inject, Injectable } from '@nestjs/common';

import {
  TIEMPO_REAL,
  TiempoRealPort,
} from 'src/common/tiempo-real/tiempo-real.port';

import { NotificacionEventosPort } from '../../application/ports/notificacion-eventos.port';
import { NotificacionProps } from '../../domain/props/notificacion.props';

/** Datos: la misma forma que un elemento de `GET /notificaciones`. */
export const EVENTO_NOTIFICACION_CREADA = 'notificacion:creada';

export function datosNotificacionCreada(n: NotificacionProps & { id: number }) {
  return {
    id: n.id,
    titulo: n.titulo,
    mensaje: n.mensaje,
    categoria: n.categoria,
    severidad: n.severidad,
    referencia: n.referencia
      ? { tipo: n.referencia.tipo, id: n.referencia.id }
      : null,
    ruta: n.ruta,
    etiquetaAccion: n.etiquetaAccion,
    creadaEn: n.creadaEn.toISOString(),
    leida: false,
    leidaEn: null,
  };
}

@Injectable()
export class NotificacionEventosWebsocketAdapter
  implements NotificacionEventosPort
{
  constructor(
    @Inject(TIEMPO_REAL) private readonly tiempoReal: TiempoRealPort,
  ) {}

  notificacionCreada(
    notificacion: NotificacionProps & { id: number },
    destinatarioIds: readonly number[],
  ): Promise<void> {
    this.tiempoReal.emitir(
      EVENTO_NOTIFICACION_CREADA,
      datosNotificacionCreada(notificacion),
      { usuarioIds: destinatarioIds },
    );

    return Promise.resolve();
  }
}
