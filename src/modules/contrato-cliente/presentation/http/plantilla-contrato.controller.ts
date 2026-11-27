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
import { Roles } from 'src/auth/decoradores/roles.decorator';
import {
  ROLES_ADMINISTRACION,
  ROLES_OFICINA,
} from 'src/auth/roles/grupos-roles';
import { CrearPlantillaContratoUseCase } from '../../application/use-cases/crear-plantilla-contrato.use-case';
import { EditarPlantillaContratoUseCase } from '../../application/use-cases/editar-plantilla-contrato.use-case';
import { EliminarPlantillaContratoUseCase } from '../../application/use-cases/eliminar-plantilla-contrato.use-case';
import { ListarPlantillasContratoUseCase } from '../../application/use-cases/listar-plantillas-contrato.use-case';
import { ObtenerPlantillaContratoUseCase } from '../../application/use-cases/obtener-plantilla-contrato.use-case';
import { CrearPlantillaContratoDto } from '../dto/crear-plantilla-contrato.dto';
import { EditarPlantillaContratoDto } from '../dto/editar-plantilla-contrato.dto';
import { ListarPlantillasContratoQueryDto } from '../dto/listar-plantillas-contrato-query.dto';
import { PlantillaContratoPresenter } from '../presenters/plantilla-contrato.presenter';

// Es el texto legal: oficina lo lee; solo administración lo cambia.
@ApiTags('contrato-plantilla')
@Controller('contrato-plantilla')
export class PlantillaContratoController {
  constructor(
    private readonly listarPlantillas: ListarPlantillasContratoUseCase,
    private readonly obtenerPlantilla: ObtenerPlantillaContratoUseCase,
    private readonly crearPlantilla: CrearPlantillaContratoUseCase,
    private readonly editarPlantilla: EditarPlantillaContratoUseCase,
    private readonly eliminarPlantilla: EliminarPlantillaContratoUseCase,
  ) {}

  @Get()
  @Roles(...ROLES_OFICINA)
  async listar(@Query() query: ListarPlantillasContratoQueryDto) {
    return PlantillaContratoPresenter.listado(
      await this.listarPlantillas.execute({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortDir: query.sortDir,
      }),
    );
  }

  @Get(':plantillaId')
  @Roles(...ROLES_OFICINA)
  async obtener(@Param('plantillaId', ParseIntPipe) plantillaId: number) {
    return PlantillaContratoPresenter.detalle(
      await this.obtenerPlantilla.execute({ plantillaId }),
    );
  }

  @Post()
  @Roles(...ROLES_ADMINISTRACION)
  async crear(
    @Body() dto: CrearPlantillaContratoDto,
    @Actor() actor: ActorHttp,
  ) {
    return PlantillaContratoPresenter.detalle(
      await this.crearPlantilla.execute({
        nombre: dto.nombre,
        body: dto.body,
        empresaId: actor.empresaId,
      }),
    );
  }

  @Patch(':plantillaId')
  @Roles(...ROLES_ADMINISTRACION)
  async editar(
    @Param('plantillaId', ParseIntPipe) plantillaId: number,
    @Body() dto: EditarPlantillaContratoDto,
  ) {
    return PlantillaContratoPresenter.detalle(
      await this.editarPlantilla.execute({
        plantillaId,
        nombre: dto.nombre,
        body: dto.body,
      }),
    );
  }

  @Delete(':plantillaId')
  @Roles(...ROLES_ADMINISTRACION)
  async eliminar(
    @Param('plantillaId', ParseIntPipe) plantillaId: number,
    @Actor() actor: ActorHttp,
  ) {
    await this.eliminarPlantilla.execute({
      plantillaId,
      usuarioId: actor.usuarioId,
    });

    return { plantillaId };
  }
}
