import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  AUTORIZACION_DESINSTALACION_QUERY,
  AutorizacionDesinstalacionQueryPort,
} from '../../domain/ports/autorizacion-desinstalacion-query.port';
import { AutorizacionDesinstalacionPendiente } from '../../domain/read-models/autorizacion-desinstalacion-pendiente.read-model';

export type ListarAutorizacionesPendientesInput = {
  page?: number;
  limit?: number;
};

@Injectable()
export class ListarAutorizacionesPendientesUseCase {
  constructor(
    @Inject(AUTORIZACION_DESINSTALACION_QUERY)
    private readonly consultas: AutorizacionDesinstalacionQueryPort,
  ) {}

  execute(
    input: ListarAutorizacionesPendientesInput,
  ): Promise<ResultadoPaginado<AutorizacionDesinstalacionPendiente>> {
    return this.consultas.findPendientes(normalizarPaginacion(input));
  }
}
