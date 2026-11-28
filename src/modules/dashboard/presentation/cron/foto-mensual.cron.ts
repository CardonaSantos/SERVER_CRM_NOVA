import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  TAREAS_PROGRAMADAS,
  TareasProgramadasPort,
} from 'src/modules/tareas-programadas/public/tareas-programadas.facade.port';

import { TomarFotoMensualUseCase } from '../../application/use-cases/tomar-foto-mensual.use-case';
import { mesQueCierra } from '../../domain/policies/foto-mensual.policy';

const TAREA = 'FOTO_MENSUAL';

/**
 * Día 1, de 00:30 a 05:30 cada hora (Guatemala): foto de la cartera del mes
 * que cerró, antes de que la jornada de las 10:00 genere facturas o cambie
 * estados. La clave es del mes: la primera vuelta que sale bien la toma y las
 * demás se saltan; las siguientes sirven de reintento si falló o el servidor
 * no estaba.
 */
@Injectable()
export class FotoMensualCron {
  private readonly logger = new Logger(FotoMensualCron.name);

  constructor(
    private readonly tomarFoto: TomarFotoMensualUseCase,
    @Inject(TAREAS_PROGRAMADAS)
    private readonly tareas: TareasProgramadasPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  @Cron('30 0-5 1 * *', { timeZone: 'America/Guatemala' })
  async tomarFotoMensual(): Promise<void> {
    const fechaOperativa = this.reloj.fechaOperativa();
    try {
      await this.tareas.ejecutarTarea({
        clave: `${TAREA}:${mesQueCierra(fechaOperativa)}`,
        tarea: TAREA,
        fechaOperativa,
        trabajo: async (contexto) => {
          const r = await this.tomarFoto.execute();
          contexto.contarProcesados(r.guardada ? 1 : 0);
          contexto.anotar('mes', r.mes);
          contexto.anotar('yaExistia', !r.guardada);
        },
      });
    } catch (error) {
      this.logger.error(
        'Falló la foto mensual de la cartera.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
