import { Inject, Injectable, Logger } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { DispositivoPushInvalidoError } from '../../domain/errors/notificacion.errors';
import {
  DISPOSITIVO_PUSH_REPOSITORY,
  DispositivoPushRegistrado,
  DispositivoPushRepositoryPort,
} from '../../domain/ports/dispositivo-push-repository.port';

export type RegistrarDispositivoPushInput = {
  usuarioId: number;
  sesionId: string;
  instalacionId: string;
  token: string;
  nombreDispositivo?: string | null;
  modeloDispositivo?: string | null;
  versionApp?: string | null;
};

const opcional = (valor?: string | null) => valor?.trim() || null;

/**
 * Cubre la primera instalación, cada inicio de sesión, el cambio de usuario
 * en el mismo teléfono y la rotación del token. Idempotente.
 */
@Injectable()
export class RegistrarDispositivoPushUseCase {
  private readonly logger = new Logger(RegistrarDispositivoPushUseCase.name);

  constructor(
    @Inject(DISPOSITIVO_PUSH_REPOSITORY)
    private readonly dispositivos: DispositivoPushRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: RegistrarDispositivoPushInput,
  ): Promise<DispositivoPushRegistrado> {
    const instalacionId = input.instalacionId.trim();
    const token = input.token.trim();

    if (!instalacionId || !token) throw new DispositivoPushInvalidoError();

    const registrado = await this.dispositivos.registrar({
      usuarioId: input.usuarioId,
      sesionId: input.sesionId,
      instalacionId,
      token,
      nombreDispositivo: opcional(input.nombreDispositivo),
      modeloDispositivo: opcional(input.modeloDispositivo),
      versionApp: opcional(input.versionApp),
      fecha: this.reloj.ahora(),
    });

    this.logger.log(
      `Dispositivo push registrado por el usuario ${input.usuarioId}.`,
    );

    return registrado;
  }
}
