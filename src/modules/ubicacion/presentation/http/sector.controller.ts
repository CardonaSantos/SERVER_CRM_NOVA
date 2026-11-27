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
import { ActualizarSectorUseCase } from '../../application/use-cases/actualizar-sector.use-case';
import { CrearSectorUseCase } from '../../application/use-cases/crear-sector.use-case';
import { EliminarSectorUseCase } from '../../application/use-cases/eliminar-sector.use-case';
import { ListarOpcionesSectorUseCase } from '../../application/use-cases/listar-opciones-sector.use-case';
import { ListarSectoresUseCase } from '../../application/use-cases/listar-sectores.use-case';
import { ObtenerSectorUseCase } from '../../application/use-cases/obtener-sector.use-case';
import { ActualizarSectorDto } from '../dto/actualizar-sector.dto';
import { CrearSectorDto } from '../dto/crear-sector.dto';
import { ListarOpcionesSectorQueryDto } from '../dto/listar-opciones-sector-query.dto';
import { ListarSectoresQueryDto } from '../dto/listar-sectores-query.dto';
import { SectorPresenter } from '../presenters/sector.presenter';

// Abiertas a cualquier sesión hasta que el dueño defina los permisos.
@ApiTags('sector')
@Controller('sector')
export class SectorController {
  constructor(
    private readonly crearSector: CrearSectorUseCase,
    private readonly actualizarSector: ActualizarSectorUseCase,
    private readonly eliminarSector: EliminarSectorUseCase,
    private readonly listarSectores: ListarSectoresUseCase,
    private readonly obtenerSector: ObtenerSectorUseCase,
    private readonly listarOpciones: ListarOpcionesSectorUseCase,
  ) {}

  @Post()
  async crear(@Body() dto: CrearSectorDto, @Actor() actor: ActorHttp) {
    return SectorPresenter.guardado(
      await this.crearSector.execute({
        usuarioId: actor.usuarioId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        municipioId: dto.municipioId,
      }),
    );
  }

  @Get()
  async listar(@Query() query: ListarSectoresQueryDto) {
    return SectorPresenter.listado(
      await this.listarSectores.execute({
        page: query.page,
        limit: query.limit,
        search: query.search,
        departamentoId: query.departamentoId,
        municipioId: query.municipioId,
        sortBy: query.sortBy,
        sortDir: query.sortDir,
      }),
    );
  }

  @Get('opciones-filtro')
  async opciones(@Query() query: ListarOpcionesSectorQueryDto) {
    const sectores = await this.listarOpciones.execute(query.municipioId);

    return sectores.map((sector) => SectorPresenter.opcion(sector));
  }

  @Get(':sectorId')
  async detalle(@Param('sectorId', ParseIntPipe) sectorId: number) {
    return SectorPresenter.item(await this.obtenerSector.execute(sectorId));
  }

  @Patch(':sectorId')
  async actualizar(
    @Param('sectorId', ParseIntPipe) sectorId: number,
    @Body() dto: ActualizarSectorDto,
    @Actor() actor: ActorHttp,
  ) {
    return SectorPresenter.guardado(
      await this.actualizarSector.execute({
        sectorId,
        usuarioId: actor.usuarioId,
        cambios: {
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          municipioId: dto.municipioId,
        },
      }),
    );
  }

  /** Borrado lógico; solo sectores sin clientes. */
  @Delete(':sectorId')
  async eliminar(
    @Param('sectorId', ParseIntPipe) sectorId: number,
    @Actor() actor: ActorHttp,
  ) {
    return SectorPresenter.eliminado(
      await this.eliminarSector.execute({
        sectorId,
        usuarioId: actor.usuarioId,
      }),
    );
  }
}
