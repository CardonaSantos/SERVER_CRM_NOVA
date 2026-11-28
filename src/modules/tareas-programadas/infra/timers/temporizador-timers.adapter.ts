import { Injectable, Logger } from '@nestjs/common';

import {
  TemporizadorActivo,
  TemporizadorPort,
} from '../../application/ports/temporizador.port';

@Injectable()
export class TemporizadorTimersAdapter implements TemporizadorPort {
  private readonly logger = new Logger(TemporizadorTimersAdapter.name);

  repetir(
    intervaloMs: number,
    trabajo: () => Promise<void>,
  ): TemporizadorActivo {
    let enCurso: Promise<void> | null = null;
    let detenido = false;

    const intervalo = setInterval(() => {
      if (detenido || enCurso) return;
      enCurso = trabajo()
        .catch((error: unknown) =>
          this.logger.warn(
            `Falló una vuelta del temporizador: ${error instanceof Error ? error.name : 'desconocido'}`,
          ),
        )
        .finally(() => {
          enCurso = null;
        });
    }, intervaloMs);
    intervalo.unref();

    return {
      detener: async () => {
        detenido = true;
        clearInterval(intervalo);
        if (enCurso) await enCurso;
      },
    };
  }
}
