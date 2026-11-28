import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  ResultadoTareaProgramada,
  TAREAS_PROGRAMADAS,
  TareasProgramadasPort,
} from 'src/modules/tareas-programadas/public/tareas-programadas.facade.port';
import { OrigenEjecucionTarea } from 'src/modules/tareas-programadas/public/tareas-programadas.types';
import { CREDITO_CRON_REPOSITORY } from '../domain/credito-cron.repository';
import { PrismaCreditoCronRepository } from '../infraestructure/prisma-credito-cron.repository';

const TAREA = 'CREDITO_MORA';

@Injectable()
export class CreditoCronService implements OnModuleInit {
  private readonly logger = new Logger(CreditoCronService.name);

  constructor(
    @Inject(CREDITO_CRON_REPOSITORY)
    private readonly credito_cron_repo: PrismaCreditoCronRepository,
    @Inject(TAREAS_PROGRAMADAS)
    private readonly tareas: TareasProgramadasPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  onModuleInit(): void {
    this.tareas.registrarTareaManual({
      tarea: TAREA,
      descripcion:
        'Calcula la mora del día de las cuotas de crédito vencidas (salta las que ya la tienen hoy).',
      ejecutar: (quien) => this.correr(quien),
    });
  }

  /**
   * Mora diaria de cuotas vencidas, con el candado y el registro de
   * `tareas-programadas` (la lógica del cálculo no cambia). Repetirla el mismo
   * día no suma mora dos veces: salta las cuotas con mora calculada hoy.
   */
  @Cron('0 1 * * *', { timeZone: 'America/Guatemala' })
  async generateMoraCreditoCuota() {
    try {
      await this.correr();
    } catch (error) {
      this.logger.error(
        'Falló la mora diaria de créditos.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private correr(quien?: {
    ejecutadaPorId: number;
  }): Promise<ResultadoTareaProgramada> {
    const fechaOperativa = this.reloj.fechaOperativa();
    return this.tareas.ejecutarTarea({
      clave: `${TAREA}:${fechaOperativa}`,
      tarea: TAREA,
      fechaOperativa,
      ...(quien && {
        origen: OrigenEjecucionTarea.MANUAL,
        ejecutadaPorId: quien.ejecutadaPorId,
      }),
      trabajo: async (contexto) => {
        const creditos =
          await this.credito_cron_repo.generateMoraCreditoCuota();
        contexto.contarProcesados(creditos.length);
      },
    });
  }
}
