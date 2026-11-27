import { Inject, Injectable } from '@nestjs/common';
import {
  COBROS_QUERY,
  CobrosQueryPort,
} from '../../domain/ports/cobros-query.port';
import { CobrosDashboardReadModel } from '../../domain/read-models/cobros.read-model';

const FILAS_DEL_PANEL = 10;

@Injectable()
export class ObtenerCobrosUseCase {
  constructor(@Inject(COBROS_QUERY) private readonly cobros: CobrosQueryPort) {}

  execute(): Promise<CobrosDashboardReadModel> {
    return this.cobros.findResumen(FILAS_DEL_PANEL);
  }
}
