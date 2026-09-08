import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

import { EstadoCuentaPppoe } from '../../domain/enums/pppoe-cliente-cuenta.enum';

import {
  CLIENTE_PPPOE_CUENTA_QUERY,
  ClientePppoeCuentaQueryPort,
} from '../../domain/ports/pppoe-cliente-cuenta-query.port';

import {
  ClientePppoeCuentaFindManyFilters,
  ClientePppoeCuentaPaginatedResult,
  OrigenCuentaPppoe,
} from '../../domain/read-models/cliente-pppoe-cuenta-listado.read-model';

export type ListarCuentasPppoeUseCaseInput = {
  empresaId: number;

  page?: number;

  limit?: number;

  search?: string | null;

  clienteId?: number | null;

  servicioInternetId?: number | null;

  mikrotikRouterId?: number | null;

  perfilHomologacionId?: number | null;

  estadoCuenta?: EstadoCuentaPppoe | null;

  estadoAcceso?: EstadoAccesoInternet | null;

  origen?: OrigenCuentaPppoe | null;
};

/**
 * Lista cuentas PPPoE mediante un read-model
 * administrativo paginado.
 *
 * No carga entidades de dominio porque esta consulta
 * no modifica estado ni ejecuta reglas de transición.
 */
@Injectable()
export class ListarCuentasPppoeUseCase {
  private static readonly DEFAULT_PAGE = 1;

  private static readonly DEFAULT_LIMIT = 20;

  private static readonly MAX_LIMIT = 100;

  constructor(
    @Inject(CLIENTE_PPPOE_CUENTA_QUERY)
    private readonly query: ClientePppoeCuentaQueryPort,
  ) {}

  execute(
    input: ListarCuentasPppoeUseCaseInput,
  ): Promise<ClientePppoeCuentaPaginatedResult> {
    const filters = this.normalizeFilters(input);

    return this.query.findMany(filters);
  }

  private normalizeFilters(
    input: ListarCuentasPppoeUseCaseInput,
  ): ClientePppoeCuentaFindManyFilters {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    const page = input.page ?? ListarCuentasPppoeUseCase.DEFAULT_PAGE;

    const limit = input.limit ?? ListarCuentasPppoeUseCase.DEFAULT_LIMIT;

    this.assertPositiveInteger(page, 'page');

    this.assertPositiveInteger(limit, 'limit');

    if (limit > ListarCuentasPppoeUseCase.MAX_LIMIT) {
      throw new BadRequestException(
        `limit no puede superar ${ListarCuentasPppoeUseCase.MAX_LIMIT}.`,
      );
    }

    this.assertOptionalPositiveInteger(input.clienteId, 'clienteId');

    this.assertOptionalPositiveInteger(
      input.servicioInternetId,
      'servicioInternetId',
    );

    this.assertOptionalPositiveInteger(
      input.mikrotikRouterId,
      'mikrotikRouterId',
    );

    this.assertOptionalPositiveInteger(
      input.perfilHomologacionId,
      'perfilHomologacionId',
    );

    return {
      empresaId: input.empresaId,

      page,

      limit,

      search: this.normalizeSearch(input.search),

      clienteId: input.clienteId ?? null,

      servicioInternetId: input.servicioInternetId ?? null,

      mikrotikRouterId: input.mikrotikRouterId ?? null,

      perfilHomologacionId: input.perfilHomologacionId ?? null,

      estadoCuenta: input.estadoCuenta ?? null,

      estadoAcceso: input.estadoAcceso ?? null,

      origen: input.origen ?? null,
    };
  }

  private normalizeSearch(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim();

    return normalized || null;
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }

  private assertOptionalPositiveInteger(
    value: number | null | undefined,
    field: string,
  ): void {
    if (value === undefined || value === null) {
      return;
    }

    this.assertPositiveInteger(value, field);
  }
}
