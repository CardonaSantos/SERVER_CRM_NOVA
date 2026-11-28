import { Injectable } from '@nestjs/common';

import { TareaManualDisponible } from '../../domain/read-models/ejecucion-tarea-listado.read-model';
import { RegistroTareasManualesService } from '../services/registro-tareas-manuales.service';

@Injectable()
export class ListarTareasManualesUseCase {
  constructor(private readonly registro: RegistroTareasManualesService) {}

  execute(): TareaManualDisponible[] {
    return this.registro.disponibles();
  }
}
