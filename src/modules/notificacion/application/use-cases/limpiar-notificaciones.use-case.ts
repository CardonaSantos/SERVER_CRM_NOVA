import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { corteRetencionNotificaciones } from '../../domain/policies/retencion-notificaciones.policy';
import {
  NOTIFICACION_REPOSITORY,
  NotificacionRepositoryPort,
} from '../../domain/ports/notificacion-repository.port';

/** Borra las notificaciones de hace más de 90 días (también de las bandejas). */
@Injectable()
export class LimpiarNotificacionesUseCase {
  constructor(
    @Inject(NOTIFICACION_REPOSITORY)
    private readonly notificaciones: NotificacionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(): Promise<{ borradas: number }> {
    const corte = corteRetencionNotificaciones(this.reloj.ahora());
    return { borradas: await this.notificaciones.borrarCreadasAntesDe(corte) };
  }
}
