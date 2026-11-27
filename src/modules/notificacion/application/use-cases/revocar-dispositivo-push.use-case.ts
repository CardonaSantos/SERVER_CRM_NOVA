import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import {
  DISPOSITIVO_PUSH_REPOSITORY,
  DispositivoPushRepositoryPort,
} from '../../domain/ports/dispositivo-push-repository.port';

export type RevocarDispositivoPushInput = {
  usuarioId: number;
  instalacionId: string;
};

/**
 * Idempotente: revocar otra vez, o una instalación de otro usuario, responde
 * `revocado: false` sin error (no revela de quién es).
 */
@Injectable()
export class RevocarDispositivoPushUseCase {
  constructor(
    @Inject(DISPOSITIVO_PUSH_REPOSITORY)
    private readonly dispositivos: DispositivoPushRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: RevocarDispositivoPushInput,
  ): Promise<{ instalacionId: string; revocado: boolean }> {
    const instalacionId = input.instalacionId.trim();
    const revocado = await this.dispositivos.revocar(
      input.usuarioId,
      instalacionId,
      this.reloj.ahora(),
    );

    return { instalacionId, revocado };
  }
}
