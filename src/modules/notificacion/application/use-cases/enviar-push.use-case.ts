import { Inject, Injectable, Logger } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import {
  DISPOSITIVO_PUSH_REPOSITORY,
  DispositivoPushRepositoryPort,
} from '../../domain/ports/dispositivo-push-repository.port';
import {
  EnviarPushInput,
  EnviarPushResult,
} from '../../public/notificacion.facade.port';
import { ENVIADOR_PUSH, EnviadorPushPort } from '../ports/enviador-push.port';

const CANAL_POR_OMISION = 'tickets';
const VIGENCIA_POR_OMISION_MS = 6 * 60 * 60 * 1000;

const omitido = (
  motivo: NonNullable<EnviarPushResult['omitido']>,
  dispositivos = 0,
): EnviarPushResult => ({
  omitido: motivo,
  dispositivos,
  exitosos: 0,
  fallidos: 0,
});

@Injectable()
export class EnviarPushUseCase {
  private readonly logger = new Logger(EnviarPushUseCase.name);

  constructor(
    @Inject(DISPOSITIVO_PUSH_REPOSITORY)
    private readonly dispositivos: DispositivoPushRepositoryPort,
    @Inject(ENVIADOR_PUSH) private readonly enviador: EnviadorPushPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: EnviarPushInput): Promise<EnviarPushResult> {
    const preferencias = await this.dispositivos.preferencias(input.usuarioId);

    if (!preferencias.push) return omitido('PUSH_DESACTIVADO');

    const tokens = await this.dispositivos.tokensActivos(input.usuarioId);

    if (tokens.length === 0) return omitido('SIN_DISPOSITIVOS');

    if (!this.enviador.disponible()) {
      return omitido('PROVEEDOR_NO_CONFIGURADO', tokens.length);
    }

    const resultado = await this.enviador.enviar({
      tokens,
      titulo: input.titulo,
      cuerpo: input.cuerpo,
      datos: input.datos ?? {},
      canal: input.canal ?? CANAL_POR_OMISION,
      claveAgrupacion: input.claveAgrupacion,
      vigenciaMs: input.vigenciaMs ?? VIGENCIA_POR_OMISION_MS,
      sonido: preferencias.sonido,
    });

    if (resultado.tokensInvalidos.length > 0) {
      await this.dispositivos.desactivarTokens(
        resultado.tokensInvalidos,
        this.reloj.ahora(),
      );
    }

    this.logger.log(
      `Push al usuario ${input.usuarioId}: ${resultado.exitosos} de ${tokens.length} entregados al proveedor.`,
    );

    return {
      omitido: null,
      dispositivos: tokens.length,
      exitosos: resultado.exitosos,
      fallidos: resultado.fallidos,
    };
  }
}
