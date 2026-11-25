import { Inject, Injectable } from '@nestjs/common';

import {
  ResultadoPaginado,
  normalizarPaginacion,
} from 'src/common/hexagonal/paginacion';
import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';

import { EstadoCuentaPppoe } from '../../domain/enums/estado-cuenta-pppoe.enum';
import {
  CLIENTE_PPPOE_CUENTA_QUERY,
  ClientePppoeCuentaQueryPort,
} from '../../domain/ports/cliente-pppoe-cuenta-query.port';
import {
  ClientePppoeCuentaListItem,
  OrigenCuentaPppoe,
} from '../../domain/read-models/cliente-pppoe-cuenta-listado.read-model';

/** Por defecto la tabla de cuentas muestra 20 filas (contrato existente). */
const LIMITE_POR_DEFECTO = 20;

export type ListarCuentasPppoeInput = {
  page?: number;
  limit?: number;
  search?: string;
  clienteId?: number;
  servicioInternetId?: number;
  mikrotikRouterId?: number;
  perfilHomologacionId?: number;
  estadoCuenta?: EstadoCuentaPppoe;
  estadoAcceso?: EstadoAccesoInternet;
  origen?: OrigenCuentaPppoe;
};

@Injectable()
export class ListarCuentasPppoeUseCase {
  constructor(
    @Inject(CLIENTE_PPPOE_CUENTA_QUERY)
    private readonly consulta: ClientePppoeCuentaQueryPort,
  ) {}

  execute(
    input: ListarCuentasPppoeInput,
  ): Promise<ResultadoPaginado<ClientePppoeCuentaListItem>> {
    return this.consulta.findMany(
      {
        search: input.search?.trim() || null,
        clienteId: input.clienteId ?? null,
        servicioInternetId: input.servicioInternetId ?? null,
        mikrotikRouterId: input.mikrotikRouterId ?? null,
        perfilHomologacionId: input.perfilHomologacionId ?? null,
        estadoCuenta: input.estadoCuenta ?? null,
        estadoAcceso: input.estadoAcceso ?? null,
        origen: input.origen ?? null,
      },
      normalizarPaginacion(input, { limitePorDefecto: LIMITE_POR_DEFECTO }),
    );
  }
}
