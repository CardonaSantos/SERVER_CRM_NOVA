import { Inject, Injectable } from '@nestjs/common';

import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';
import {
  TIEMPO_REAL,
  TiempoRealPort,
} from 'src/common/tiempo-real/tiempo-real.port';

import {
  AvisoMensajeBot,
  MensajeriaClienteEventosPort,
} from '../../application/ports/mensajeria-cliente-eventos.port';

/** Datos: `{ wamid, recibidoEn }`. El chat vuelve a pedir los mensajes. */
export const EVENTO_MENSAJE_RECIBIDO = 'mensajeria-cliente:mensaje-recibido';

@Injectable()
export class MensajeriaClienteEventosWebsocketAdapter
  implements MensajeriaClienteEventosPort
{
  constructor(
    @Inject(TIEMPO_REAL) private readonly tiempoReal: TiempoRealPort,
  ) {}

  mensajeBotRecibido(aviso: AvisoMensajeBot): Promise<void> {
    this.tiempoReal.emitir(
      EVENTO_MENSAJE_RECIBIDO,
      { wamid: aviso.wamid, recibidoEn: aviso.recibidoEn.toISOString() },
      { roles: ROLES_OFICINA },
    );

    return Promise.resolve();
  }
}
