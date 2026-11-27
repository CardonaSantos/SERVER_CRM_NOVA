import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import {
  BANDEJA_NOTIFICACION_REPOSITORY,
  BandejaNotificacionRepositoryPort,
} from '../../domain/ports/bandeja-notificacion-repository.port';

/** Marca como leídas todas las de la bandeja de quien actúa. */
@Injectable()
export class MarcarNotificacionesLeidasUseCase {
  constructor(
    @Inject(BANDEJA_NOTIFICACION_REPOSITORY)
    private readonly bandeja: BandejaNotificacionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: { usuarioId: number }): Promise<{ marcadas: number }> {
    const marcadas = await this.bandeja.marcarTodasLeidas(
      input.usuarioId,
      this.reloj.ahora(),
    );

    return { marcadas };
  }
}
