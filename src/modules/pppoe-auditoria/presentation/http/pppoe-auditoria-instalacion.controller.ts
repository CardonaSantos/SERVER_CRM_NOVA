import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';

import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';

import { ListarAuditoriaPppoeInstalacionUseCase } from '../../application/use-cases/listar-auditoria-pppoe-instalacion.use-case';
import { ListarAuditoriaPppoeInstalacionQueryDto } from '../dto/listar-auditoria-pppoe-instalacion-query.dto';
import { PppoeAuditoriaInstalacionPresenter } from '../presenters/pppoe-auditoria-instalacion.presenter';

@Controller('cliente-instalaciones')
export class PppoeAuditoriaInstalacionController {
  constructor(
    private readonly listarTimeline: ListarAuditoriaPppoeInstalacionUseCase,
  ) {}

  /** Línea de tiempo PPPoE de una instalación (solo oficina/administración). */
  @Get(':instalacionId/auditoria-pppoe')
  @Roles(...ROLES_OFICINA)
  async findTimelineByInstalacion(
    @Param('instalacionId', ParseIntPipe) instalacionId: number,
    @Query() query: ListarAuditoriaPppoeInstalacionQueryDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.listarTimeline.execute({
      empresaId: actor.empresaId,
      instalacionId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      tipoOperacion: query.tipoOperacion,
      estadoOperacion: query.estadoOperacion,
      accion: query.accion,
      origen: query.origen,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
      ordenDireccion: query.ordenDireccion,
    });

    return PppoeAuditoriaInstalacionPresenter.paginatedToHttp(resultado);
  }
}
