import { Injectable } from '@nestjs/common';

import {
  EjecutarTareaInput,
  ResultadoTareaProgramada,
  TareasProgramadasPort,
} from '../../public/tareas-programadas.facade.port';
import { EjecutarTareaProgramadaUseCase } from '../use-cases/ejecutar-tarea-programada.use-case';

@Injectable()
export class TareasProgramadasFacade implements TareasProgramadasPort {
  constructor(
    private readonly ejecutarTareaUseCase: EjecutarTareaProgramadaUseCase,
  ) {}

  ejecutarTarea(input: EjecutarTareaInput): Promise<ResultadoTareaProgramada> {
    return this.ejecutarTareaUseCase.execute(input);
  }
}
