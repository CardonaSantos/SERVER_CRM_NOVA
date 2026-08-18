import {
  Controller,
  Get,
  Param,
  Delete,
  ParseIntPipe,
  Req,
  BadRequestException,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user?: {
    id?: number | string;
    sub?: number | string;
    userId?: number | string;

    empresaId?: number | string;

    nombre?: string;
  };
};

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/get-dashboard-info/:id')
  findAll(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.findAll(id);
  }

  @Get('/get-tickets-asignados/:id')
  findTicketsAsignados(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.findTicketsAsignados(id);
  }

  @Get('/get-ticket-asignado-details/:id')
  ticketDetailsAsignado(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.ticketDetailsAsignado(id);
  }

  /**
   * Retorno principal de datos
   * @returns
   */
  @Get('/get-dashboard-data')
  getDashboardData() {
    return this.dashboardService.getDashboardData();
  }

  /**
   * Retorno principal de datos nuevos
   * @returns
   */
  @Get('/get-new-dashboard-data')
  getNewDashboardData() {
    return this.dashboardService.dashboardData();
  }

  /**
   * Retorno instalaciones vs desinstalacines
   * @returns
   */
  @Get('/instalaciones-vs-desinstalaciones')
  getDashboardInstalacionesChart() {
    return this.dashboardService.getDashboardInstalacionesChart();
  }

  /**
   * Retorno de instaalciones historicas anio
   * @returns
   */
  @Get('/instalaciones-historicas')
  getDashboardInstalacionesHistoricasChart() {
    return this.dashboardService.getDashboardInstalacionesHistoricasChart();
  }

  /**
   * Retorno de instaalciones historicas anio
   * @returns
   */
  @Get('/tickets-proceso')
  getDashboardTicketProceso() {
    return this.dashboardService.getDashboardTicketProceso();
  }

  /**
   * Top Mororoso
   * @returns
   */
  @Get('/cobros')
  getTopMorososDashboard() {
    return this.dashboardService.getTopMorososDashboard();
  }

  /**
   * Panel operativo del técnico autenticado.
   *
   * El ID se obtiene exclusivamente del JWT validado.
   * No se recibe técnicoId por params, query ni body.
   */
  @UseGuards(JwtAuthGuard)
  @Get('panel-tecnico')
  async getDashboardPanelTecnico(@Req() req: AuthenticatedRequest) {
    const rawTecnicoId = req.user?.id ?? req.user?.sub ?? req.user?.userId;

    const tecnicoId = Number(rawTecnicoId);

    if (!Number.isInteger(tecnicoId) || tecnicoId <= 0) {
      throw new UnauthorizedException(
        'No fue posible identificar al técnico autenticado.',
      );
    }

    return this.dashboardService.get_dashboard_panel_tecnico(tecnicoId);
  }
}
