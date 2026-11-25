import { Controller, Get, Query } from '@nestjs/common';

import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';

import { ListarPppoeAuditoriasUseCase } from '../../application/use-cases/listar-pppoe-auditorias.use-case';
import { ListarPppoeAuditoriasQueryDto } from '../dto/listar-pppoe-auditorias-query.dto';
import { PppoeAuditoriaPresenter } from '../presenters/pppoe-auditoria.presenter';

@Controller('pppoe-auditoria')
export class PppoeAuditoriaController {
  constructor(
    private readonly listarAuditorias: ListarPppoeAuditoriasUseCase,
  ) {}

  /** Listado administrativo paginado de la bitácora PPPoE. */
  @Get()
  async findAll(
    @Query() query: ListarPppoeAuditoriasQueryDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.listarAuditorias.execute({
      empresaId: actor.empresaId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      accion: query.accion,
      origen: query.origen,
      clienteId: query.clienteId,
      instalacionId: query.instalacionId,
      accesoInternetId: query.accesoInternetId,
      cuentaPppoeId: query.cuentaPppoeId,
      perfilHomologacionId: query.perfilHomologacionId,
      operadorId: query.operadorId,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
    });

    return PppoeAuditoriaPresenter.paginatedToHttp(resultado);
  }
}
