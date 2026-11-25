import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';

import { ActivarPerfilHomologacionUseCase } from '../../application/use-cases/activar-perfil-homologacion.use-case';
import { ActualizarCodigoPerfilHomologacionUseCase } from '../../application/use-cases/actualizar-codigo-perfil-homologacion.use-case';
import { CrearPerfilHomologacionUseCase } from '../../application/use-cases/crear-perfil-homologacion.use-case';
import { DesactivarPerfilHomologacionUseCase } from '../../application/use-cases/desactivar-perfil-homologacion.use-case';
import { ListarPerfilesHomologacionSeleccionablesUseCase } from '../../application/use-cases/listar-perfiles-homologacion-seleccionables.use-case';
import { ListarPerfilesHomologacionUseCase } from '../../application/use-cases/listar-perfiles-homologacion.use-case';
import { ObtenerPerfilHomologacionUseCase } from '../../application/use-cases/obtener-perfil-homologacion.use-case';
import { ActualizarCodigoPerfilHomologacionDto } from '../dto/actualizar-codigo-perfil-homologacion.dto';
import { CrearPerfilHomologacionDto } from '../dto/crear-perfil-homologacion.dto';
import { ListarPerfilesHomologacionSeleccionablesQueryDto } from '../dto/listar-perfiles-homologacion-seleccionables-query.dto';
import { ListarPerfilesHomologacionQueryDto } from '../dto/listar-perfiles-homologacion-query.dto';
import { PerfilHomologacionPresenter } from '../presenters/perfil-homologacion.presenter';

/** Homologación servicio de internet ↔ profile de MikroTik. */
@Controller('ppoe-perfil-homologacion')
export class PerfilHomologacionController {
  constructor(
    private readonly crearPerfil: CrearPerfilHomologacionUseCase,
    private readonly listarPerfiles: ListarPerfilesHomologacionUseCase,
    private readonly listarSeleccionables: ListarPerfilesHomologacionSeleccionablesUseCase,
    private readonly obtenerPerfil: ObtenerPerfilHomologacionUseCase,
    private readonly actualizarCodigo: ActualizarCodigoPerfilHomologacionUseCase,
    private readonly activarPerfil: ActivarPerfilHomologacionUseCase,
    private readonly desactivarPerfil: DesactivarPerfilHomologacionUseCase,
  ) {}

  @Post()
  @Roles(...ROLES_OFICINA)
  async create(
    @Body() dto: CrearPerfilHomologacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const perfil = await this.crearPerfil.execute({
      empresaId: actor.empresaId,
      creadoPorId: actor.usuarioId,
      mikrotikRouterId: dto.mikrotikRouterId,
      servicioInternetId: dto.servicioInternetId,
      codigoPerfil: dto.codigoPerfil,
    });
    return PerfilHomologacionPresenter.item(perfil);
  }

  @Get()
  async findAll(@Query() query: ListarPerfilesHomologacionQueryDto) {
    const resultado = await this.listarPerfiles.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      activo: query.activo,
      mikrotikRouterId: query.mikrotikRouterId,
      servicioInternetId: query.servicioInternetId,
    });
    return PerfilHomologacionPresenter.listado(resultado);
  }

  /** Opciones para el combo: homologaciones activas de routers y servicios activos. */
  @Get('select')
  async getHomologacionesSelect(
    @Query() query: ListarPerfilesHomologacionSeleccionablesQueryDto,
  ) {
    const opciones = await this.listarSeleccionables.execute({
      search: query.search,
    });
    return opciones.map((o) => PerfilHomologacionPresenter.opcion(o));
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return PerfilHomologacionPresenter.item(
      await this.obtenerPerfil.execute({ id }),
    );
  }

  @Patch(':id/codigo-perfil')
  @Roles(...ROLES_OFICINA)
  async updateCodigoPerfil(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarCodigoPerfilHomologacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const perfil = await this.actualizarCodigo.execute({
      id,
      codigoPerfil: dto.codigoPerfil,
      actualizadoPorId: actor.usuarioId,
    });
    return PerfilHomologacionPresenter.item(perfil);
  }

  @Patch(':id/activar')
  @Roles(...ROLES_OFICINA)
  async activar(
    @Param('id', ParseIntPipe) id: number,
    @Actor() actor: ActorHttp,
  ) {
    const perfil = await this.activarPerfil.execute({
      id,
      actualizadoPorId: actor.usuarioId,
    });
    return PerfilHomologacionPresenter.item(perfil);
  }

  @Patch(':id/desactivar')
  @Roles(...ROLES_OFICINA)
  async desactivar(
    @Param('id', ParseIntPipe) id: number,
    @Actor() actor: ActorHttp,
  ) {
    const perfil = await this.desactivarPerfil.execute({
      id,
      actualizadoPorId: actor.usuarioId,
    });
    return PerfilHomologacionPresenter.item(perfil);
  }
}
