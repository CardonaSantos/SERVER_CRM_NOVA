import { Inject, Injectable } from '@nestjs/common';

import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../../domain/enums/pppoe-auditoria.enum';
import { InstalacionAuditoriaNoEncontradaError } from '../../domain/errors/pppoe-auditoria.errors';
import {
  PPPOE_AUDITORIA_INSTALACION_QUERY,
  PppoeAuditoriaInstalacionQueryPort,
} from '../../domain/ports/pppoe-auditoria-instalacion-query.port';
import { PppoeAuditoriaInstalacionPaginatedResult } from '../../domain/read-models/pppoe-auditoria-instalacion.read-model';
import { RangoFechasAuditoriaService } from '../services/rango-fechas-auditoria.service';

export type ListarAuditoriaPppoeInstalacionInput = {
  empresaId: number;
  instalacionId: number;
  page?: number;
  limit?: number;
  search?: string;
  tipoOperacion?: TipoOperacionPppoe;
  estadoOperacion?: EstadoOperacionPppoe;
  accion?: AccionAuditoriaPppoe;
  origen?: OrigenOperacionPppoe;
  /** `YYYY-MM-DD` (día completo en Guatemala) o fecha ISO con hora. */
  fechaDesde?: string;
  fechaHasta?: string;
  ordenDireccion?: 'asc' | 'desc';
};

/** Línea de tiempo PPPoE de una instalación. */
@Injectable()
export class ListarAuditoriaPppoeInstalacionUseCase {
  constructor(
    @Inject(PPPOE_AUDITORIA_INSTALACION_QUERY)
    private readonly queryPort: PppoeAuditoriaInstalacionQueryPort,
    private readonly rangoFechas: RangoFechasAuditoriaService,
  ) {}

  async execute(
    input: ListarAuditoriaPppoeInstalacionInput,
  ): Promise<PppoeAuditoriaInstalacionPaginatedResult> {
    const { fechaDesde, fechaHasta } = this.rangoFechas.interpretar(
      input.fechaDesde,
      input.fechaHasta,
    );

    const resultado = await this.queryPort.findTimelineByInstalacion({
      empresaId: input.empresaId,
      instalacionId: input.instalacionId,
      page: input.page ?? 1,
      limit: input.limit ?? 10,
      search: input.search?.trim() || null,
      tipoOperacion: input.tipoOperacion ?? null,
      estadoOperacion: input.estadoOperacion ?? null,
      accion: input.accion ?? null,
      origen: input.origen ?? null,
      fechaDesde,
      fechaHasta,
      ordenDireccion: input.ordenDireccion ?? 'desc',
    });

    if (!resultado) throw new InstalacionAuditoriaNoEncontradaError();

    return resultado;
  }
}
