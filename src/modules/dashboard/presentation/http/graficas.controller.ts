import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import { ROLES_SIN_TECNICO } from 'src/auth/roles/grupos-roles';
import { ObtenerClientesPorPlanUseCase } from '../../application/use-cases/obtener-clientes-por-plan.use-case';
import { ObtenerClientesPorUbicacionUseCase } from '../../application/use-cases/obtener-clientes-por-ubicacion.use-case';
import { ObtenerCobradoPorMetodoUseCase } from '../../application/use-cases/obtener-cobrado-por-metodo.use-case';
import { ObtenerDeudaAntiguedadUseCase } from '../../application/use-cases/obtener-deuda-antiguedad.use-case';
import { ObtenerFacturacionMensualUseCase } from '../../application/use-cases/obtener-facturacion-mensual.use-case';
import { MesesQueryDto, UbicacionQueryDto } from '../dto/graficas-query.dto';
import { GraficasPresenter } from '../presenters/graficas.presenter';

// Gráficas de dinero y cartera: mismas personas que el resto del panel general.
@ApiTags('dashboard')
@Controller('dashboard')
export class GraficasController {
  constructor(
    private readonly facturacion: ObtenerFacturacionMensualUseCase,
    private readonly metodos: ObtenerCobradoPorMetodoUseCase,
    private readonly antiguedad: ObtenerDeudaAntiguedadUseCase,
    private readonly planes: ObtenerClientesPorPlanUseCase,
    private readonly ubicacion: ObtenerClientesPorUbicacionUseCase,
  ) {}

  @Get('facturacion-mensual')
  @Roles(...ROLES_SIN_TECNICO)
  async facturacionMensual(@Query() query: MesesQueryDto) {
    return GraficasPresenter.facturacionMensual(
      await this.facturacion.execute({ meses: query.meses }),
    );
  }

  @Get('cobrado-por-metodo')
  @Roles(...ROLES_SIN_TECNICO)
  async cobradoPorMetodo(@Query() query: MesesQueryDto) {
    return GraficasPresenter.cobradoPorMetodo(
      await this.metodos.execute({ meses: query.meses }),
    );
  }

  @Get('deuda-antiguedad')
  @Roles(...ROLES_SIN_TECNICO)
  async deudaAntiguedad() {
    return GraficasPresenter.deudaAntiguedad(await this.antiguedad.execute());
  }

  @Get('clientes-por-plan')
  @Roles(...ROLES_SIN_TECNICO)
  async clientesPorPlan() {
    return GraficasPresenter.clientesPorPlan(await this.planes.execute());
  }

  @Get('clientes-por-ubicacion')
  @Roles(...ROLES_SIN_TECNICO)
  async clientesPorUbicacion(@Query() query: UbicacionQueryDto) {
    return GraficasPresenter.clientesPorUbicacion(
      await this.ubicacion.execute({ agrupar: query.agrupar }),
    );
  }
}
