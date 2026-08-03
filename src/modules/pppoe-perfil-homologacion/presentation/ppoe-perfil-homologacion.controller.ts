import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';
import { PpoePerfilHomologacionService } from '../application/services/ppoe-perfil-homologacion.service';
import { ListarPpoePerfilesHomologacionQueryDto } from '../application/dto/listar-ppoe-perfiles-homologacion-query.dto';
import { CreatePpoePerfilHomologacionDto } from '../dto/create-ppoe-perfil-homologacion.dto';
import { PpoePerfilHomologacionPresenter } from './ppoe-perfil-homologacion.presenter';
import {
  AuthenticatedPppoeRequest,
  getAuthenticatedPppoeActor,
} from '../../pppoe-automatizacion/presentation/http/pppoe-authenticated-actor.http';
import { UpdatePpoePerfilHomologacionDto } from '../application/dto/update-ppoe-perfil-homologacion.dto';
import { ListarPerfilesHomologacionSeleccionablesQuery } from '../application/dto/homologacion-query';

@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('ppoe-perfil-homologacion')
export class PpoePerfilHomologacionController {
  constructor(
    private readonly ppoePerfilHomologacionService: PpoePerfilHomologacionService,
  ) {}

  /**
   * Crea una homologación nueva.
   *
   * empresaId y creadoPorId se obtienen del JWT.
   */
  @Post()
  async create(
    @Body()
    dto: CreatePpoePerfilHomologacionDto,

    @Req()
    req: AuthenticatedPppoeRequest,
  ) {
    const actor = getAuthenticatedPppoeActor(req);

    const perfil = await this.ppoePerfilHomologacionService.create({
      ...dto,

      empresaId: actor.empresaId,
      creadoPorId: actor.operadorId,
    });

    return PpoePerfilHomologacionPresenter.toHttp(perfil);
  }

  /**
   * Lista homologaciones con paginación, filtros
   * y relaciones enriquecidas.
   */
  @Get()
  async findAll(
    @Query()
    query: ListarPpoePerfilesHomologacionQueryDto,
  ) {
    const result = await this.ppoePerfilHomologacionService.findAll(query);

    return PpoePerfilHomologacionPresenter.paginatedToHttp(result);
  }

  // conseguir registros para selects
  @Get('select')
  async getHomologacionesSelect(
    @Query()
    query: ListarPerfilesHomologacionSeleccionablesQuery,
  ) {
    const homologaciones =
      await this.ppoePerfilHomologacionService.get_homologaciones_select(query);

    return homologaciones;
  }

  /**
   * Obtiene una homologación por id.
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    const perfil = await this.ppoePerfilHomologacionService.findOne(id);

    return PpoePerfilHomologacionPresenter.toHttp(perfil);
  }

  /**
   * Actualiza únicamente el código real del perfil MikroTik.
   *
   * actualizadoPorId se obtiene del JWT.
   */
  @Patch(':id/codigo-perfil')
  async updateCodigoPerfil(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdatePpoePerfilHomologacionDto,

    @Req()
    req: AuthenticatedPppoeRequest,
  ) {
    const actor = getAuthenticatedPppoeActor(req);

    const perfil = await this.ppoePerfilHomologacionService.update(id, {
      ...dto,

      actualizadoPorId: actor.operadorId,
    });

    return PpoePerfilHomologacionPresenter.toHttp(perfil);
  }

  /**
   * Activa una homologación existente.
   *
   * actualizadoPorId se obtiene del JWT.
   */
  @Patch(':id/activar')
  async activar(
    @Param('id', ParseIntPipe)
    id: number,

    @Req()
    req: AuthenticatedPppoeRequest,
  ) {
    const actor = getAuthenticatedPppoeActor(req);

    const perfil = await this.ppoePerfilHomologacionService.activar(id, {
      actualizadoPorId: actor.operadorId,
    });

    return PpoePerfilHomologacionPresenter.toHttp(perfil);
  }

  /**
   * Desactiva una homologación existente.
   *
   * actualizadoPorId se obtiene del JWT.
   */
  @Patch(':id/desactivar')
  async desactivar(
    @Param('id', ParseIntPipe)
    id: number,

    @Req()
    req: AuthenticatedPppoeRequest,
  ) {
    const actor = getAuthenticatedPppoeActor(req);

    const perfil = await this.ppoePerfilHomologacionService.desactivar(id, {
      actualizadoPorId: actor.operadorId,
    });

    return PpoePerfilHomologacionPresenter.toHttp(perfil);
  }
}
