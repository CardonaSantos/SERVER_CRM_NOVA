import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import { ROLES_SIN_TECNICO } from 'src/auth/roles/grupos-roles';
import { ObtenerActividadTicketsUseCase } from '../../application/use-cases/obtener-actividad-tickets.use-case';
import { ObtenerCobrosUseCase } from '../../application/use-cases/obtener-cobros.use-case';
import { ObtenerInstalacionesHistoricasUseCase } from '../../application/use-cases/obtener-instalaciones-historicas.use-case';
import { ObtenerInstalacionesMesUseCase } from '../../application/use-cases/obtener-instalaciones-mes.use-case';
import { ObtenerPanelTecnicoUseCase } from '../../application/use-cases/obtener-panel-tecnico.use-case';
import { ObtenerResumenUseCase } from '../../application/use-cases/obtener-resumen.use-case';
import { ActividadTicketsQueryDto } from '../dto/actividad-tickets-query.dto';
import { DashboardPresenter } from '../presenters/dashboard.presenter';

// El panel general lo ven todos menos el técnico; su panel muestra solo lo propio.
@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly obtenerResumen: ObtenerResumenUseCase,
    private readonly obtenerInstalacionesMes: ObtenerInstalacionesMesUseCase,
    private readonly obtenerInstalacionesHistoricas: ObtenerInstalacionesHistoricasUseCase,
    private readonly obtenerActividadTickets: ObtenerActividadTicketsUseCase,
    private readonly obtenerCobros: ObtenerCobrosUseCase,
    private readonly obtenerPanelTecnico: ObtenerPanelTecnicoUseCase,
  ) {}

  @Get('resumen')
  @Roles(...ROLES_SIN_TECNICO)
  async resumen() {
    return DashboardPresenter.resumen(await this.obtenerResumen.execute());
  }

  @Get('instalaciones-mes')
  @Roles(...ROLES_SIN_TECNICO)
  async instalacionesMes() {
    return DashboardPresenter.instalacionesMes(
      await this.obtenerInstalacionesMes.execute(),
    );
  }

  @Get('instalaciones-historicas')
  @Roles(...ROLES_SIN_TECNICO)
  async instalacionesHistoricas() {
    return DashboardPresenter.instalacionesHistoricas(
      await this.obtenerInstalacionesHistoricas.execute(),
    );
  }

  @Get('tickets-actividad')
  @Roles(...ROLES_SIN_TECNICO)
  async ticketsActividad(@Query() query: ActividadTicketsQueryDto) {
    return DashboardPresenter.actividadTickets(
      await this.obtenerActividadTickets.execute({
        preset: query.preset,
        desde: query.desde,
        hasta: query.hasta,
      }),
    );
  }

  @Get('cobros')
  @Roles(...ROLES_SIN_TECNICO)
  async cobros() {
    return DashboardPresenter.cobros(await this.obtenerCobros.execute());
  }

  @Get('panel-tecnico')
  async panelTecnico(@Actor() actor: ActorHttp) {
    return DashboardPresenter.panelTecnico(
      await this.obtenerPanelTecnico.execute({ usuarioId: actor.usuarioId }),
    );
  }
}
