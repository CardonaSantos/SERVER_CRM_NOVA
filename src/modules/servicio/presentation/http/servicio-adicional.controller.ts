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
import { ActualizarServicioAdicionalUseCase } from '../../application/use-cases/actualizar-servicio-adicional.use-case';
import { CrearServicioAdicionalUseCase } from '../../application/use-cases/crear-servicio-adicional.use-case';
import { EliminarServicioAdicionalUseCase } from '../../application/use-cases/eliminar-servicio-adicional.use-case';
import { ListarOpcionesServicioAdicionalUseCase } from '../../application/use-cases/listar-opciones-servicio-adicional.use-case';
import { ListarServiciosAdicionalesUseCase } from '../../application/use-cases/listar-servicios-adicionales.use-case';
import { ObtenerServicioAdicionalUseCase } from '../../application/use-cases/obtener-servicio-adicional.use-case';
import { ActualizarServicioAdicionalDto } from '../dto/actualizar-servicio-adicional.dto';
import { CrearServicioAdicionalDto } from '../dto/crear-servicio-adicional.dto';
import { ListarServiciosAdicionalesQueryDto } from '../dto/listar-servicios-adicionales-query.dto';
import { ServicioAdicionalPresenter } from '../presenters/servicio-adicional.presenter';

// Abiertas a cualquier sesión hasta que el dueño defina los permisos.
@ApiTags('servicio')
@Controller('servicio')
export class ServicioAdicionalController {
  constructor(
    private readonly crearServicio: CrearServicioAdicionalUseCase,
    private readonly actualizarServicio: ActualizarServicioAdicionalUseCase,
    private readonly eliminarServicio: EliminarServicioAdicionalUseCase,
    private readonly listarServicios: ListarServiciosAdicionalesUseCase,
    private readonly obtenerServicio: ObtenerServicioAdicionalUseCase,
    private readonly listarOpciones: ListarOpcionesServicioAdicionalUseCase,
  ) {}

  @Post()
  async crear(
    @Body() dto: CrearServicioAdicionalDto,
    @Actor() actor: ActorHttp,
  ) {
    return ServicioAdicionalPresenter.guardado(
      await this.crearServicio.execute({
        usuarioId: actor.usuarioId,
        empresaId: actor.empresaId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        precio: dto.precio,
        tipoServicioId: dto.tipoServicioId,
      }),
    );
  }

  @Get()
  async listar(@Query() query: ListarServiciosAdicionalesQueryDto) {
    return ServicioAdicionalPresenter.listado(
      await this.listarServicios.execute({
        page: query.page,
        limit: query.limit,
        search: query.search,
        estados: query.estados,
        tipoServicioId: query.tipoServicioId,
        sortBy: query.sortBy,
        sortDir: query.sortDir,
      }),
    );
  }

  @Get('opciones-filtro')
  async opciones() {
    const servicios = await this.listarOpciones.execute();

    return servicios.map((servicio) =>
      ServicioAdicionalPresenter.opcion(servicio),
    );
  }

  @Get(':servicioId')
  async detalle(@Param('servicioId', ParseIntPipe) servicioId: number) {
    return ServicioAdicionalPresenter.item(
      await this.obtenerServicio.execute(servicioId),
    );
  }

  @Patch(':servicioId')
  async actualizar(
    @Param('servicioId', ParseIntPipe) servicioId: number,
    @Body() dto: ActualizarServicioAdicionalDto,
    @Actor() actor: ActorHttp,
  ) {
    return ServicioAdicionalPresenter.guardado(
      await this.actualizarServicio.execute({
        servicioId,
        usuarioId: actor.usuarioId,
        cambios: {
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          precio: dto.precio,
          estado: dto.estado,
          tipoServicioId: dto.tipoServicioId,
        },
      }),
    );
  }

  /** Borrado lógico; solo servicios sin asignaciones ni facturas. */
  @Delete(':servicioId')
  async eliminar(
    @Param('servicioId', ParseIntPipe) servicioId: number,
    @Actor() actor: ActorHttp,
  ) {
    return ServicioAdicionalPresenter.eliminado(
      await this.eliminarServicio.execute({
        servicioId,
        usuarioId: actor.usuarioId,
      }),
    );
  }
}
