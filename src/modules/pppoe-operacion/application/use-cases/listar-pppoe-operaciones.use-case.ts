import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { OrigenOperacionPppoe } from '../../../pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from '../../domain/enums/pppoe-operacion-operacion-paso.enums';

import {
  PPPOE_OPERACION_QUERY,
  PppoeOperacionQueryPort,
} from '../../domain/ports/pppoe-operacion-query.port';

import {
  PppoeOperacionFindManyFilters,
  PppoeOperacionPaginatedResult,
} from '../../domain/read-models/pppoe-operacion.read-model';

/**
 * Datos admitidos por el listado paginado.
 */
export type ListarPppoeOperacionesUseCaseInput = {
  empresaId: number;

  page?: number;

  limit?: number;

  search?: string | null;

  cuentaPppoeId?: number | null;

  mikrotikRouterId?: number | null;

  perfilHomologacionId?: number | null;

  instalacionId?: number | null;

  desinstalacionId?: number | null;

  iniciadoPorId?: number | null;

  reautenticadoPorId?: number | null;

  reintentoDeId?: number | null;

  tipos?: TipoOperacionPppoe[] | null;

  origenes?: OrigenOperacionPppoe[] | null;

  canales?: CanalOperacionPppoe[] | null;

  estados?: EstadoOperacionPppoe[] | null;

  requiereReautenticacion?: boolean | null;

  numeroIntento?: number | null;

  fechaDesde?: Date | null;

  fechaHasta?: Date | null;

  ordenPor?: 'creadoEn' | 'iniciadoEn' | 'finalizadoEn' | 'numeroIntento';

  ordenDireccion?: 'asc' | 'desc';
};

/**
 * Devuelve el listado paginado de operaciones PPPoE.
 */
@Injectable()
export class ListarPppoeOperacionesUseCase {
  private static readonly DEFAULT_PAGE = 1;

  private static readonly DEFAULT_LIMIT = 20;

  private static readonly MAX_LIMIT = 100;

  constructor(
    @Inject(PPPOE_OPERACION_QUERY)
    private readonly query: PppoeOperacionQueryPort,
  ) {}

  async execute(
    input: ListarPppoeOperacionesUseCaseInput,
  ): Promise<PppoeOperacionPaginatedResult> {
    const filters = this.normalizeFilters(input);

    return this.query.findPaginated(filters);
  }

  /**
   * Valida y normaliza los filtros recibidos.
   */
  private normalizeFilters(
    input: ListarPppoeOperacionesUseCaseInput,
  ): PppoeOperacionFindManyFilters {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    const page = input.page ?? ListarPppoeOperacionesUseCase.DEFAULT_PAGE;

    const limit = input.limit ?? ListarPppoeOperacionesUseCase.DEFAULT_LIMIT;

    this.assertPositiveInteger(page, 'page');

    this.assertPositiveInteger(limit, 'limit');

    if (limit > ListarPppoeOperacionesUseCase.MAX_LIMIT) {
      throw new BadRequestException(
        `limit no puede superar ${ListarPppoeOperacionesUseCase.MAX_LIMIT}.`,
      );
    }

    this.assertOptionalPositiveInteger(input.cuentaPppoeId, 'cuentaPppoeId');

    this.assertOptionalPositiveInteger(
      input.mikrotikRouterId,
      'mikrotikRouterId',
    );

    this.assertOptionalPositiveInteger(
      input.perfilHomologacionId,
      'perfilHomologacionId',
    );

    this.assertOptionalPositiveInteger(input.instalacionId, 'instalacionId');

    this.assertOptionalPositiveInteger(
      input.desinstalacionId,
      'desinstalacionId',
    );

    this.assertOptionalPositiveInteger(input.iniciadoPorId, 'iniciadoPorId');

    this.assertOptionalPositiveInteger(
      input.reautenticadoPorId,
      'reautenticadoPorId',
    );

    this.assertOptionalPositiveInteger(input.reintentoDeId, 'reintentoDeId');

    this.assertOptionalPositiveInteger(input.numeroIntento, 'numeroIntento');

    const fechaDesde = this.normalizeOptionalDate(
      input.fechaDesde,
      'fechaDesde',
    );

    const fechaHasta = this.normalizeOptionalDate(
      input.fechaHasta,
      'fechaHasta',
    );

    if (
      fechaDesde &&
      fechaHasta &&
      fechaDesde.getTime() > fechaHasta.getTime()
    ) {
      throw new BadRequestException(
        'fechaDesde no puede ser posterior a fechaHasta.',
      );
    }

    return {
      empresaId: input.empresaId,

      page,

      limit,

      search: this.normalizeSearch(input.search),

      cuentaPppoeId: input.cuentaPppoeId ?? null,

      mikrotikRouterId: input.mikrotikRouterId ?? null,

      perfilHomologacionId: input.perfilHomologacionId ?? null,

      instalacionId: input.instalacionId ?? null,

      desinstalacionId: input.desinstalacionId ?? null,

      iniciadoPorId: input.iniciadoPorId ?? null,

      reautenticadoPorId: input.reautenticadoPorId ?? null,

      reintentoDeId: input.reintentoDeId ?? null,

      tipos: this.normalizeArray(input.tipos),

      origenes: this.normalizeArray(input.origenes),

      canales: this.normalizeArray(input.canales),

      estados: this.normalizeArray(input.estados),

      requiereReautenticacion: input.requiereReautenticacion ?? null,

      numeroIntento: input.numeroIntento ?? null,

      fechaDesde,

      fechaHasta,

      ordenPor: input.ordenPor ?? 'creadoEn',

      ordenDireccion: input.ordenDireccion ?? 'desc',
    };
  }

  /**
   * Limpia una búsqueda vacía.
   */
  private normalizeSearch(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim();

    return normalized || null;
  }

  /**
   * Elimina duplicados y convierte arrays vacíos en null.
   */
  private normalizeArray<T>(values?: T[] | null): T[] | null {
    if (!values || values.length === 0) {
      return null;
    }

    return [...new Set(values)];
  }

  private normalizeOptionalDate(
    value: Date | null | undefined,
    field: string,
  ): Date | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new BadRequestException(`${field} debe contener una fecha válida.`);
    }

    return new Date(value.getTime());
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
