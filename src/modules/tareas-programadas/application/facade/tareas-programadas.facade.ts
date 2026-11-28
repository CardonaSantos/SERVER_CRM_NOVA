import { Injectable } from '@nestjs/common';

import {
  EjecutarTareaInput,
  RegistrarEtapaInput,
  RegistrarTareaManualInput,
  ResultadoTareaProgramada,
  TareasProgramadasPort,
} from '../../public/tareas-programadas.facade.port';
import { RegistroEtapasJornadaService } from '../services/registro-etapas-jornada.service';
import { RegistroTareasManualesService } from '../services/registro-tareas-manuales.service';
import { EjecutarTareaProgramadaUseCase } from '../use-cases/ejecutar-tarea-programada.use-case';

@Injectable()
export class TareasProgramadasFacade implements TareasProgramadasPort {
  constructor(
    private readonly ejecutarTareaUseCase: EjecutarTareaProgramadaUseCase,
    private readonly registroEtapas: RegistroEtapasJornadaService,
    private readonly registroManuales: RegistroTareasManualesService,
  ) {}

  ejecutarTarea(input: EjecutarTareaInput): Promise<ResultadoTareaProgramada> {
    return this.ejecutarTareaUseCase.execute(input);
  }

  registrarEtapa(input: RegistrarEtapaInput): void {
    this.registroEtapas.registrar(input);
  }

  registrarTareaManual(input: RegistrarTareaManualInput): void {
    this.registroManuales.registrar(input);
  }
}
