import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import {
  BANDEJA_NOTIFICACION_REPOSITORY,
  BandejaNotificacionRepositoryPort,
} from '../../domain/ports/bandeja-notificacion-repository.port';

/** Vacía la bandeja de quien actúa; las notificaciones siguen en la base. */
@Injectable()
export class DescartarNotificacionesUseCase {
  constructor(
    @Inject(BANDEJA_NOTIFICACION_REPOSITORY)
    private readonly bandeja: BandejaNotificacionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: {
    usuarioId: number;
  }): Promise<{ descartadas: number }> {
    const descartadas = await this.bandeja.descartarTodas(
      input.usuarioId,
      this.reloj.ahora(),
    );

    return { descartadas };
  }
}
