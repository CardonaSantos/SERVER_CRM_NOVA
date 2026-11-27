import { Inject, Injectable } from '@nestjs/common';

import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';
import {
  TIEMPO_REAL,
  TiempoRealPort,
} from 'src/common/tiempo-real/tiempo-real.port';

import { RutaCobroEventosPort } from '../../application/ports/ruta-cobro-eventos.port';

/** Datos: `{ rutaId }`. La pantalla vuelve a pedir la ruta. */
export const EVENTO_RUTA_COBRO_CAMBIADA = 'ruta-cobro:cambiada';

@Injectable()
export class RutaCobroEventosWebsocketAdapter implements RutaCobroEventosPort {
  constructor(
    @Inject(TIEMPO_REAL) private readonly tiempoReal: TiempoRealPort,
  ) {}

  rutaCambiada(_empresaId: number, rutaId: number): Promise<void> {
    this.tiempoReal.emitir(
      EVENTO_RUTA_COBRO_CAMBIADA,
      { rutaId },
      { roles: ROLES_OFICINA },
    );

    return Promise.resolve();
  }
}
