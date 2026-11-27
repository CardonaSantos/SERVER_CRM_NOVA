import { Inject, Injectable } from '@nestjs/common';

import {
  NOTIFICACION_QUERY,
  NotificacionQueryPort,
} from '../../domain/ports/notificacion-query.port';
import { ContadoresNotificacion } from '../../domain/read-models/notificacion-bandeja.read-model';

@Injectable()
export class ContarNotificacionesUseCase {
  constructor(
    @Inject(NOTIFICACION_QUERY)
    private readonly consulta: NotificacionQueryPort,
  ) {}

  execute(input: { usuarioId: number }): Promise<ContadoresNotificacion> {
    return this.consulta.contar(input.usuarioId);
  }
}
