import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { OperacionSensible } from 'src/auth/step-up/operacion-sensible.decorator';
import { ActualizarPlanInternetUseCase } from '../../application/use-cases/actualizar-plan-internet.use-case';
import { CambiarPrecioPlanInternetUseCase } from '../../application/use-cases/cambiar-precio-plan-internet.use-case';
import { CrearPlanInternetUseCase } from '../../application/use-cases/crear-plan-internet.use-case';
import { EliminarPlanInternetUseCase } from '../../application/use-cases/eliminar-plan-internet.use-case';
import { ListarOpcionesPlanInternetUseCase } from '../../application/use-cases/listar-opciones-plan-internet.use-case';
import { ListarPlanesInternetUseCase } from '../../application/use-cases/listar-planes-internet.use-case';
import { ObtenerPlanInternetUseCase } from '../../application/use-cases/obtener-plan-internet.use-case';
import { ActualizarPlanInternetDto } from '../dto/actualizar-plan-internet.dto';
import { CambiarPrecioPlanInternetDto } from '../dto/cambiar-precio-plan-internet.dto';
import { CrearPlanInternetDto } from '../dto/crear-plan-internet.dto';
import { ListarPlanesInternetQueryDto } from '../dto/listar-planes-internet-query.dto';
import { PlanInternetPresenter } from '../presenters/plan-internet.presenter';

// Abiertas a cualquier sesión hasta que el dueño defina los permisos.
@ApiTags('servicio-internet')
@Controller('servicio-internet')
export class PlanInternetController {
  constructor(
    private readonly crearPlan: CrearPlanInternetUseCase,
    private readonly actualizarPlan: ActualizarPlanInternetUseCase,
    private readonly cambiarPrecio: CambiarPrecioPlanInternetUseCase,
    private readonly eliminarPlan: EliminarPlanInternetUseCase,
    private readonly listarPlanes: ListarPlanesInternetUseCase,
    private readonly obtenerPlan: ObtenerPlanInternetUseCase,
    private readonly listarOpciones: ListarOpcionesPlanInternetUseCase,
  ) {}

  @Post()
  async crear(@Body() dto: CrearPlanInternetDto, @Actor() actor: ActorHttp) {
    return PlanInternetPresenter.guardado(
      await this.crearPlan.execute({
        usuarioId: actor.usuarioId,
        empresaId: actor.empresaId,
        nombre: dto.nombre,
        velocidad: dto.velocidad,
        precio: dto.precio,
      }),
    );
  }

  @Get()
  async listar(@Query() query: ListarPlanesInternetQueryDto) {
    return PlanInternetPresenter.listado(
      await this.listarPlanes.execute({
        page: query.page,
        limit: query.limit,
        search: query.search,
        estados: query.estados,
        sortBy: query.sortBy,
        sortDir: query.sortDir,
      }),
    );
  }

  @Get('opciones-filtro')
  async opciones() {
    const planes = await this.listarOpciones.execute();

    return planes.map((plan) => PlanInternetPresenter.opcion(plan));
  }

  @Get(':planId')
  async detalle(@Param('planId', ParseIntPipe) planId: number) {
    return PlanInternetPresenter.detalle(
      await this.obtenerPlan.execute(planId),
    );
  }

  /** Cambia nombre, velocidad o estado; el precio tiene su propia ruta. */
  @Patch(':planId')
  async actualizar(
    @Param('planId', ParseIntPipe) planId: number,
    @Body() dto: ActualizarPlanInternetDto,
    @Actor() actor: ActorHttp,
  ) {
    return PlanInternetPresenter.guardado(
      await this.actualizarPlan.execute({
        planId,
        usuarioId: actor.usuarioId,
        cambios: {
          nombre: dto.nombre,
          velocidad: dto.velocidad,
          estado: dto.estado,
        },
      }),
    );
  }

  /** Cambia lo que se cobrará a todos los clientes del plan. */
  @Patch(':planId/precio')
  @OperacionSensible()
  async precio(
    @Param('planId', ParseIntPipe) planId: number,
    @Body() dto: CambiarPrecioPlanInternetDto,
    @Actor() actor: ActorHttp,
  ) {
    return PlanInternetPresenter.precio(
      await this.cambiarPrecio.execute({
        planId,
        usuarioId: actor.usuarioId,
        precio: dto.precio,
        contrasenaActual: dto.contrasenaActual,
      }),
    );
  }

  /** Borrado lógico; solo planes que nunca se usaron. */
  @Delete(':planId')
  async eliminar(
    @Param('planId', ParseIntPipe) planId: number,
    @Actor() actor: ActorHttp,
  ) {
    return PlanInternetPresenter.eliminado(
      await this.eliminarPlan.execute({ planId, usuarioId: actor.usuarioId }),
    );
  }
}
