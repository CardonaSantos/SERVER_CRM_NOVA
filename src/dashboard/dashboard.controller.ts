import { Controller, Get, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

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
}
