import { Inject, Injectable } from '@nestjs/common';

import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';
import {
  TIEMPO_REAL,
  TiempoRealPort,
} from 'src/common/tiempo-real/tiempo-real.port';

import { FacturacionEventosPort } from '../../application/ports/facturacion-eventos.port';

/** Sin datos: la pantalla vuelve a pedir lo que muestra. */
export const EVENTO_FACTURACION_CAMBIADA = 'facturacion:cambiada';

@Injectable()
export class FacturacionEventosWebsocketAdapter
  implements FacturacionEventosPort
{
  constructor(
    @Inject(TIEMPO_REAL) private readonly tiempoReal: TiempoRealPort,
  ) {}

  facturacionCambiada(): Promise<void> {
    this.tiempoReal.emitir(
      EVENTO_FACTURACION_CAMBIADA,
      {},
      {
        roles: ROLES_OFICINA,
      },
    );

    return Promise.resolve();
  }
}
