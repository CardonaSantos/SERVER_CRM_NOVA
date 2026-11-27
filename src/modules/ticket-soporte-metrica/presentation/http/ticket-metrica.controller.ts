import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ObtenerResueltosPorDiaUseCase } from '../../application/use-cases/obtener-resueltos-por-dia.use-case';
import { ObtenerResumenMetricasUseCase } from '../../application/use-cases/obtener-resumen-metricas.use-case';
import { MetricaMesQueryDto } from '../dto/metrica-mes-query.dto';
import { MetricaTicketPresenter } from '../presenters/metrica-ticket.presenter';

// Abiertas a cualquier sesión hasta que el dueño defina los permisos.
@ApiTags('ticket-metrica')
@Controller('ticket-metrica')
export class TicketMetricaController {
  constructor(
    private readonly resumenMetricas: ObtenerResumenMetricasUseCase,
    private readonly resueltosPorDia: ObtenerResueltosPorDiaUseCase,
  ) {}

  @Get('resumen')
  async resumen(@Query() query: MetricaMesQueryDto) {
    return MetricaTicketPresenter.resumen(
      await this.resumenMetricas.execute({ mes: query.mes }),
    );
  }

  @Get('resueltos-por-dia')
  async porDia(@Query() query: MetricaMesQueryDto) {
    return MetricaTicketPresenter.porDia(
      await this.resueltosPorDia.execute({ mes: query.mes }),
    );
  }
}
