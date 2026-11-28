import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  TAREAS_PROGRAMADAS,
  TareasProgramadasPort,
} from 'src/modules/tareas-programadas/public/tareas-programadas.facade.port';
import { CREDITO_CRON_REPOSITORY } from '../domain/credito-cron.repository';
import { PrismaCreditoCronRepository } from '../infraestructure/prisma-credito-cron.repository';

@Injectable()
export class CreditoCronService {
  private readonly logger = new Logger(CreditoCronService.name);

  constructor(
    @Inject(CREDITO_CRON_REPOSITORY)
    private readonly credito_cron_repo: PrismaCreditoCronRepository,
    @Inject(TAREAS_PROGRAMADAS)
    private readonly tareas: TareasProgramadasPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  /**
   * Mora diaria de cuotas vencidas, con el candado y el registro de
   * `tareas-programadas` (la lógica del cálculo no cambia). Repetirla el mismo
   * día no suma mora dos veces: salta las cuotas con mora calculada hoy.
   */
  @Cron('0 1 * * *', { timeZone: 'America/Guatemala' })
  async generateMoraCreditoCuota() {
    const fechaOperativa = this.reloj.fechaOperativa();
    try {
      await this.tareas.ejecutarTarea({
        clave: `CREDITO_MORA:${fechaOperativa}`,
        tarea: 'CREDITO_MORA',
        fechaOperativa,
        trabajo: async (contexto) => {
          const creditos =
            await this.credito_cron_repo.generateMoraCreditoCuota();
          contexto.contarProcesados(creditos.length);
        },
      });
    } catch (error) {
      this.logger.error(
        'Falló la mora diaria de créditos.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
