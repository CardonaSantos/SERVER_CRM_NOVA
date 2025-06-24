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

  @Get('/get-dashboard-data')
  getDashboardData() {
    return this.dashboardService.getDashboardData();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dashboardService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dashboardService.remove(+id);
  }
}
