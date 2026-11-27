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
import { ActualizarEtiquetaTicketUseCase } from '../../application/use-cases/actualizar-etiqueta-ticket.use-case';
import { CrearEtiquetaTicketUseCase } from '../../application/use-cases/crear-etiqueta-ticket.use-case';
import { EliminarEtiquetaTicketUseCase } from '../../application/use-cases/eliminar-etiqueta-ticket.use-case';
import { ListarEtiquetasTicketUseCase } from '../../application/use-cases/listar-etiquetas-ticket.use-case';
import { GuardarEtiquetaTicketDto } from '../dto/guardar-etiqueta-ticket.dto';
import { ListarCatalogoTicketQueryDto } from '../dto/listar-catalogo-ticket-query.dto';
import { CatalogoTicketPresenter } from '../presenters/catalogo-ticket.presenter';

// Abiertas a cualquier sesión hasta que el dueño defina los permisos.
@ApiTags('ticket-etiqueta')
@Controller('ticket-etiqueta')
export class TicketEtiquetaController {
  constructor(
    private readonly listarEtiquetas: ListarEtiquetasTicketUseCase,
    private readonly crearEtiqueta: CrearEtiquetaTicketUseCase,
    private readonly actualizarEtiqueta: ActualizarEtiquetaTicketUseCase,
    private readonly eliminarEtiqueta: EliminarEtiquetaTicketUseCase,
  ) {}

  @Get()
  async listar(@Query() query: ListarCatalogoTicketQueryDto) {
    return CatalogoTicketPresenter.etiquetas(
      await this.listarEtiquetas.execute({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortDir: query.sortDir,
      }),
    );
  }

  @Post()
  async crear(@Body() dto: GuardarEtiquetaTicketDto) {
    return CatalogoTicketPresenter.etiqueta(
      await this.crearEtiqueta.execute({ nombre: dto.nombre }),
    );
  }

  @Patch(':etiquetaId')
  async actualizar(
    @Param('etiquetaId', ParseIntPipe) etiquetaId: number,
    @Body() dto: GuardarEtiquetaTicketDto,
  ) {
    return CatalogoTicketPresenter.etiqueta(
      await this.actualizarEtiqueta.execute({
        etiquetaId,
        nombre: dto.nombre,
      }),
    );
  }

  /** Deja de ofrecerse; los tickets que la tienen la conservan. */
  @Delete(':etiquetaId')
  eliminar(
    @Param('etiquetaId', ParseIntPipe) etiquetaId: number,
    @Actor() actor: ActorHttp,
  ) {
    return this.eliminarEtiqueta.execute({
      etiquetaId,
      usuarioId: actor.usuarioId,
    });
  }
}
