import { Injectable } from '@nestjs/common';

import {
  EjecutarTareaInput,
  RegistrarEtapaInput,
  ResultadoTareaProgramada,
  TareasProgramadasPort,
} from '../../public/tareas-programadas.facade.port';
import { RegistroEtapasJornadaService } from '../services/registro-etapas-jornada.service';
import { EjecutarTareaProgramadaUseCase } from '../use-cases/ejecutar-tarea-programada.use-case';

@Injectable()
export class TareasProgramadasFacade implements TareasProgramadasPort {
  constructor(
    private readonly ejecutarTareaUseCase: EjecutarTareaProgramadaUseCase,
    private readonly registroEtapas: RegistroEtapasJornadaService,
  ) {}

  ejecutarTarea(input: EjecutarTareaInput): Promise<ResultadoTareaProgramada> {
    return this.ejecutarTareaUseCase.execute(input);
  }

  registrarEtapa(input: RegistrarEtapaInput): void {
    this.registroEtapas.registrar(input);
  }
}
