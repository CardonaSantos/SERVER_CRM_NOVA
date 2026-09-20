import { Injectable } from '@nestjs/common';

import { ListarPppoeAuditoriasQueryDto } from '../dto/listar-pppoe-auditorias-query.dto';
import { ListarAuditoriaPppoeInstalacionQueryDto } from '../dto/listar-auditoria-pppoe-instalacion-query.dto';

import { PppoeAuditoriaPaginatedResult } from '../../domain/read-models/pppoe-auditoria-list.read-model';
import { PppoeAuditoriaInstalacionPaginatedResult } from '../../domain/read-models/pppoe-auditoria-instalacion.read-model';

import { ListarPppoeAuditoriasUseCase } from '../use-cases/listar-pppoe-auditorias.use-case';
import { ListarAuditoriaPppoeInstalacionUseCase } from '../use-cases/listar-auditoria-pppoe-instalacion.use-case';

export type ListarAuditoriaPppoeInstalacionServiceParams = {
  instalacionId: number;
  empresaId: number;
  actorRol: string;
  query: ListarAuditoriaPppoeInstalacionQueryDto;
};

@Injectable()
export class PppoeAuditoriaService {
  constructor(
    private readonly listarPppoeAuditoriasUseCase: ListarPppoeAuditoriasUseCase,

    private readonly listarAuditoriaPppoeInstalacionUseCase: ListarAuditoriaPppoeInstalacionUseCase,
  ) {}

  findAll(
    query: ListarPppoeAuditoriasQueryDto,
  ): Promise<PppoeAuditoriaPaginatedResult> {
    return this.listarPppoeAuditoriasUseCase.execute(query);
  }

  findTimelineByInstalacion(
    params: ListarAuditoriaPppoeInstalacionServiceParams,
  ): Promise<PppoeAuditoriaInstalacionPaginatedResult | null> {
    return this.listarAuditoriaPppoeInstalacionUseCase.execute(params);
  }
}
