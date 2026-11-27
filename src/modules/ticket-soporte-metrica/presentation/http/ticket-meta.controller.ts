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
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';
import { ActualizarMetaTicketUseCase } from '../../application/use-cases/actualizar-meta-ticket.use-case';
import { CancelarMetaTicketUseCase } from '../../application/use-cases/cancelar-meta-ticket.use-case';
import { CrearMetaTicketUseCase } from '../../application/use-cases/crear-meta-ticket.use-case';
import { ListarMetasTicketUseCase } from '../../application/use-cases/listar-metas-ticket.use-case';
import { ObtenerMetaTicketUseCase } from '../../application/use-cases/obtener-meta-ticket.use-case';
import { ActualizarMetaTicketDto } from '../dto/actualizar-meta-ticket.dto';
import { CrearMetaTicketDto } from '../dto/crear-meta-ticket.dto';
import { ListarMetasTicketQueryDto } from '../dto/listar-metas-ticket-query.dto';
import { MetaTicketPresenter } from '../presenters/meta-ticket.presenter';

// Leer, cualquier sesión; crear, editar y cancelar, oficina.
@ApiTags('ticket-meta')
@Controller('ticket-meta')
export class TicketMetaController {
  constructor(
    private readonly crearMeta: CrearMetaTicketUseCase,
    private readonly actualizarMeta: ActualizarMetaTicketUseCase,
    private readonly cancelarMeta: CancelarMetaTicketUseCase,
    private readonly listarMetas: ListarMetasTicketUseCase,
    private readonly obtenerMeta: ObtenerMetaTicketUseCase,
  ) {}

  @Post()
  @Roles(...ROLES_OFICINA)
  async crear(@Body() dto: CrearMetaTicketDto) {
    const meta = await this.crearMeta.execute({
      tecnicoId: dto.tecnicoId,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin,
      objetivo: dto.objetivo,
      titulo: dto.titulo,
    });

    return MetaTicketPresenter.item(meta);
  }

  @Get()
  async listar(@Query() query: ListarMetasTicketQueryDto) {
    const resultado = await this.listarMetas.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
      tecnicoId: query.tecnicoId,
      estados: query.estados,
      desde: query.desde,
      hasta: query.hasta,
    });

    return MetaTicketPresenter.listado(resultado);
  }

  @Get(':metaId')
  async obtener(@Param('metaId', ParseIntPipe) metaId: number) {
    return MetaTicketPresenter.item(await this.obtenerMeta.execute({ metaId }));
  }

  @Patch(':metaId')
  @Roles(...ROLES_OFICINA)
  async actualizar(
    @Param('metaId', ParseIntPipe) metaId: number,
    @Body() dto: ActualizarMetaTicketDto,
  ) {
    const meta = await this.actualizarMeta.execute({
      metaId,
      titulo: dto.titulo,
      fechaInicio: dto.fechaInicio ?? undefined,
      fechaFin: dto.fechaFin ?? undefined,
      objetivo: dto.objetivo ?? undefined,
    });

    return MetaTicketPresenter.item(meta);
  }

  @Post(':metaId/cancelar')
  @Roles(...ROLES_OFICINA)
  async cancelar(@Param('metaId', ParseIntPipe) metaId: number) {
    return MetaTicketPresenter.item(
      await this.cancelarMeta.execute({ metaId }),
    );
  }
}
