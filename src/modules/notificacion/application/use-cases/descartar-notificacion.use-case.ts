import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { NotificacionNoEncontradaError } from '../../domain/errors/notificacion.errors';
import {
  BANDEJA_NOTIFICACION_REPOSITORY,
  BandejaNotificacionRepositoryPort,
} from '../../domain/ports/bandeja-notificacion-repository.port';

export type DescartarNotificacionInput = {
  usuarioId: number;
  notificacionId: number;
};

/** La quita de la bandeja de quien actúa; la notificación sigue en la base. */
@Injectable()
export class DescartarNotificacionUseCase {
  constructor(
    @Inject(BANDEJA_NOTIFICACION_REPOSITORY)
    private readonly bandeja: BandejaNotificacionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: DescartarNotificacionInput,
  ): Promise<{ notificacionId: number }> {
    const encontrada = await this.bandeja.descartar(
      input.usuarioId,
      input.notificacionId,
      this.reloj.ahora(),
    );

    if (!encontrada) throw new NotificacionNoEncontradaError();

    return { notificacionId: input.notificacionId };
  }
}
