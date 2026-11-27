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
import { ActualizarSolucionTicketUseCase } from '../../application/use-cases/actualizar-solucion-ticket.use-case';
import { CrearSolucionTicketUseCase } from '../../application/use-cases/crear-solucion-ticket.use-case';
import { EliminarSolucionTicketUseCase } from '../../application/use-cases/eliminar-solucion-ticket.use-case';
import { ListarSolucionesTicketUseCase } from '../../application/use-cases/listar-soluciones-ticket.use-case';
import { ActualizarSolucionTicketDto } from '../dto/actualizar-solucion-ticket.dto';
import { CrearSolucionTicketDto } from '../dto/crear-solucion-ticket.dto';
import { ListarCatalogoTicketQueryDto } from '../dto/listar-catalogo-ticket-query.dto';
import { CatalogoTicketPresenter } from '../presenters/catalogo-ticket.presenter';

// Abiertas a cualquier sesión hasta que el dueño defina los permisos.
@ApiTags('ticket-solucion')
@Controller('ticket-solucion')
export class TicketSolucionController {
  constructor(
    private readonly listarSoluciones: ListarSolucionesTicketUseCase,
    private readonly crearSolucion: CrearSolucionTicketUseCase,
    private readonly actualizarSolucion: ActualizarSolucionTicketUseCase,
    private readonly eliminarSolucion: EliminarSolucionTicketUseCase,
  ) {}

  @Get()
  async listar(@Query() query: ListarCatalogoTicketQueryDto) {
    return CatalogoTicketPresenter.soluciones(
      await this.listarSoluciones.execute({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortDir: query.sortDir,
      }),
    );
  }

  @Post()
  async crear(@Body() dto: CrearSolucionTicketDto) {
    return CatalogoTicketPresenter.solucion(
      await this.crearSolucion.execute({
        nombre: dto.nombre,
        descripcion: dto.descripcion,
      }),
    );
  }

  @Patch(':solucionId')
  async actualizar(
    @Param('solucionId', ParseIntPipe) solucionId: number,
    @Body() dto: ActualizarSolucionTicketDto,
  ) {
    return CatalogoTicketPresenter.solucion(
      await this.actualizarSolucion.execute({
        solucionId,
        nombre: dto.nombre ?? undefined,
        descripcion: dto.descripcion,
      }),
    );
  }

  /** Deja de ofrecerse; los tickets resueltos con ella la conservan. */
  @Delete(':solucionId')
  eliminar(
    @Param('solucionId', ParseIntPipe) solucionId: number,
    @Actor() actor: ActorHttp,
  ) {
    return this.eliminarSolucion.execute({
      solucionId,
      usuarioId: actor.usuarioId,
    });
  }
}
