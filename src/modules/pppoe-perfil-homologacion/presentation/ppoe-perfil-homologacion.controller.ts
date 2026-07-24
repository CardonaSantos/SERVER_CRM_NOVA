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
import { PpoePerfilHomologacionService } from '../application/services/ppoe-perfil-homologacion.service';
import { CreatePpoePerfilHomologacionDto } from '../dto/create-ppoe-perfil-homologacion.dto';
import { UpdatePpoePerfilHomologacionDto } from '../dto/update-ppoe-perfil-homologacion.dto';
import { PpoePerfilHomologacionPresenter } from './ppoe-perfil-homologacion.presenter';
import { CambiarEstadoPpoePerfilHomologacionDto } from '../application/dto/cambiar-estado-ppoe-perfil-homologacion.dto';
import { ListarPpoePerfilesHomologacionQueryDto } from '../application/dto/listar-ppoe-perfiles-homologacion-query.dto';

@Controller('ppoe-perfil-homologacion')
export class PpoePerfilHomologacionController {
  constructor(
    private readonly ppoePerfilHomologacionService: PpoePerfilHomologacionService,
  ) {}

  /**
   * Crea una homologación nueva.
   */
  @Post()
  async create(
    @Body()
    dto: CreatePpoePerfilHomologacionDto,
  ) {
    const perfil = await this.ppoePerfilHomologacionService.create(dto);

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
   */
  @Patch(':id/codigo-perfil')
  async updateCodigoPerfil(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdatePpoePerfilHomologacionDto,
  ) {
    const perfil = await this.ppoePerfilHomologacionService.update(id, dto);

    return PpoePerfilHomologacionPresenter.toHttp(perfil);
  }

  /**
   * Activa una homologación existente.
   */
  @Patch(':id/activar')
  async activar(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: CambiarEstadoPpoePerfilHomologacionDto,
  ) {
    const perfil = await this.ppoePerfilHomologacionService.activar(id, dto);

    return PpoePerfilHomologacionPresenter.toHttp(perfil);
  }

  /**
   * Desactiva una homologación sin eliminarla.
   */
  @Patch(':id/desactivar')
  async desactivar(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: CambiarEstadoPpoePerfilHomologacionDto,
  ) {
    const perfil = await this.ppoePerfilHomologacionService.desactivar(id, dto);

    return PpoePerfilHomologacionPresenter.toHttp(perfil);
  }
}
