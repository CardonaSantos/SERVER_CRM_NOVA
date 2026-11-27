import { Inject, Injectable, Logger } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import {
  DISPOSITIVO_PUSH_REPOSITORY,
  DispositivoPushRepositoryPort,
} from '../../domain/ports/dispositivo-push-repository.port';

/**
 * Al revocarse una sesión (logout, otra sesión la cerró, usuario desactivado,
 * reutilización del refresh), el teléfono que registró deja de recibir push.
 * No depende de que la app alcance a revocarlo.
 */
@Injectable()
export class RevocarDispositivosDeSesionesUseCase {
  private readonly logger = new Logger(
    RevocarDispositivosDeSesionesUseCase.name,
  );

  constructor(
    @Inject(DISPOSITIVO_PUSH_REPOSITORY)
    private readonly dispositivos: DispositivoPushRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: { sesionIds: readonly string[] }): Promise<number> {
    const sesionIds = [...new Set(input.sesionIds.filter(Boolean))];

    if (sesionIds.length === 0) return 0;

    const revocados = await this.dispositivos.revocarPorSesiones(
      sesionIds,
      this.reloj.ahora(),
    );

    if (revocados > 0) {
      this.logger.log(
        `${revocados} dispositivo(s) push revocados con su sesión.`,
      );
    }

    return revocados;
  }
}
