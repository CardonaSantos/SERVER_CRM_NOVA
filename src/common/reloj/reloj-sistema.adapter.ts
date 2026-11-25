import { Injectable } from '@nestjs/common';

import { fechaNegocioDe } from './fecha-negocio';
import { RelojPort } from './reloj.port';

/** Reloj real del servidor. Único lugar donde se lee la hora del sistema. */
@Injectable()
export class RelojSistemaAdapter implements RelojPort {
  ahora(): Date {
    return new Date();
  }

  fechaOperativa(): string {
    return fechaNegocioDe(this.ahora());
  }
}
