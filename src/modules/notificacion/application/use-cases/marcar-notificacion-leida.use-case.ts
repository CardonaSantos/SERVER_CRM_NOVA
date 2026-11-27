import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { NotificacionNoEncontradaError } from '../../domain/errors/notificacion.errors';
import {
  BANDEJA_NOTIFICACION_REPOSITORY,
  BandejaNotificacionRepositoryPort,
} from '../../domain/ports/bandeja-notificacion-repository.port';

export type MarcarNotificacionLeidaInput = {
  usuarioId: number;
  notificacionId: number;
};

/** Repetirlo no es error; una notificación ajena o descartada responde 404. */
@Injectable()
export class MarcarNotificacionLeidaUseCase {
  constructor(
    @Inject(BANDEJA_NOTIFICACION_REPOSITORY)
    private readonly bandeja: BandejaNotificacionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: MarcarNotificacionLeidaInput,
  ): Promise<{ notificacionId: number }> {
    const encontrada = await this.bandeja.marcarLeida(
      input.usuarioId,
      input.notificacionId,
      this.reloj.ahora(),
    );

    if (!encontrada) throw new NotificacionNoEncontradaError();

    return { notificacionId: input.notificacionId };
  }
}
