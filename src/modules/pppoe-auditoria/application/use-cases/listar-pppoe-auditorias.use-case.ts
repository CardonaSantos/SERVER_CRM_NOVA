import { Inject, Injectable } from '@nestjs/common';

import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../../domain/enums/pppoe-auditoria.enum';
import {
  PPPOE_AUDITORIA_REPOSITORY,
  PppoeAuditoriaRepositoryPort,
} from '../../domain/ports/pppoe-auditoria-repository.port';
import { PppoeAuditoriaPaginatedResult } from '../../domain/read-models/pppoe-auditoria-list.read-model';
import { RangoFechasAuditoriaService } from '../services/rango-fechas-auditoria.service';

export type ListarPppoeAuditoriasInput = {
  empresaId: number;
  page?: number;
  limit?: number;
  search?: string;
  accion?: AccionAuditoriaPppoe;
  origen?: OrigenOperacionPppoe;
  clienteId?: number;
  instalacionId?: number;
  accesoInternetId?: number;
  cuentaPppoeId?: number;
  perfilHomologacionId?: number;
  operadorId?: number;
  /** `YYYY-MM-DD` (día completo en Guatemala) o fecha ISO con hora. */
  fechaDesde?: string;
  fechaHasta?: string;
};

/** Listado administrativo paginado de la bitácora PPPoE, del más reciente al más antiguo. */
@Injectable()
export class ListarPppoeAuditoriasUseCase {
  constructor(
    @Inject(PPPOE_AUDITORIA_REPOSITORY)
    private readonly auditoriaRepository: PppoeAuditoriaRepositoryPort,
    private readonly rangoFechas: RangoFechasAuditoriaService,
  ) {}

  execute(
    input: ListarPppoeAuditoriasInput,
  ): Promise<PppoeAuditoriaPaginatedResult> {
    const { fechaDesde, fechaHasta } = this.rangoFechas.interpretar(
      input.fechaDesde,
      input.fechaHasta,
    );

    return this.auditoriaRepository.findPaginated({
      empresaId: input.empresaId,
      page: input.page ?? 1,
      limit: input.limit ?? 10,
      search: input.search?.trim() || null,
      accion: input.accion ?? null,
      origen: input.origen ?? null,
      clienteId: input.clienteId ?? null,
      instalacionId: input.instalacionId ?? null,
      accesoInternetId: input.accesoInternetId ?? null,
      cuentaPppoeId: input.cuentaPppoeId ?? null,
      perfilHomologacionId: input.perfilHomologacionId ?? null,
      operadorId: input.operadorId ?? null,
      fechaDesde,
      fechaHasta,
      ordenPor: 'creadoEn',
      ordenDireccion: 'desc',
    });
  }
}
