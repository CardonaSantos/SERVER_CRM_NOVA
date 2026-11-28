import { Inject, Injectable, Logger } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { SituacionEjecucionTarea } from '../../domain/enums/ejecucion-tarea.enum';
import {
  TareaProgramadaEnCursoError,
  TareaProgramadaNoManualError,
} from '../../domain/errors/tareas-programadas.errors';
import { claveJornada } from '../../domain/policies/jornada.policy';
import {
  EJECUCION_TAREA_REPOSITORY,
  EjecucionTareaRepositoryPort,
} from '../../domain/ports/ejecucion-tarea-repository.port';
import { ResultadoTareaProgramada } from '../../public/tareas-programadas.facade.port';
import {
  REAUTENTICACION_OPERADOR_TAREAS,
  ReautenticacionOperadorPort,
} from '../ports/reautenticacion-operador.port';
import { RegistroTareasManualesService } from '../services/registro-tareas-manuales.service';

export type EjecutarTareaManualInput = {
  tarea: string;
  usuarioId: number;
  contrasenaActual: string;
};

/**
 * Lanza a mano una tarea registrada como manual, con su clave de hoy. Retoma
 * una fallida o agotada sin esperar; nunca una completada ni una en curso.
 * Mientras corre la jornada del día no se lanza nada.
 */
@Injectable()
export class EjecutarTareaManualUseCase {
  private readonly logger = new Logger(EjecutarTareaManualUseCase.name);

  constructor(
    private readonly registro: RegistroTareasManualesService,
    @Inject(EJECUCION_TAREA_REPOSITORY)
    private readonly ejecuciones: EjecucionTareaRepositoryPort,
    @Inject(REAUTENTICACION_OPERADOR_TAREAS)
    private readonly reautenticacion: ReautenticacionOperadorPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: EjecutarTareaManualInput,
  ): Promise<ResultadoTareaProgramada> {
    const tarea = this.registro.buscar(input.tarea);
    if (!tarea) throw new TareaProgramadaNoManualError();

    await this.reautenticacion.confirmar(
      input.usuarioId,
      input.contrasenaActual,
    );

    const jornada = await this.ejecuciones.findByClave(
      claveJornada(this.reloj.fechaOperativa()),
    );
    if (
      jornada?.situacion(this.reloj.ahora()) ===
      SituacionEjecucionTarea.EN_CURSO
    ) {
      throw new TareaProgramadaEnCursoError();
    }

    this.logger.log(
      `[TAREA] Manual tarea=${input.tarea} usuarioId=${input.usuarioId}`,
    );
    const resultado = await tarea.ejecutar({ ejecutadaPorId: input.usuarioId });
    if (resultado.resultado === 'OMITIDA' && resultado.motivo === 'EN_CURSO') {
      throw new TareaProgramadaEnCursoError();
    }
    return resultado;
  }
}
