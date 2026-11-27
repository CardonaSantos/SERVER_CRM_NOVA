import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';

import { ContarNotificacionesUseCase } from '../../application/use-cases/contar-notificaciones.use-case';
import { DescartarNotificacionUseCase } from '../../application/use-cases/descartar-notificacion.use-case';
import { DescartarNotificacionesUseCase } from '../../application/use-cases/descartar-notificaciones.use-case';
import { ListarNotificacionesUseCase } from '../../application/use-cases/listar-notificaciones.use-case';
import { MarcarNotificacionLeidaUseCase } from '../../application/use-cases/marcar-notificacion-leida.use-case';
import { MarcarNotificacionesLeidasUseCase } from '../../application/use-cases/marcar-notificaciones-leidas.use-case';
import { ListarNotificacionesQueryDto } from '../dto/listar-notificaciones-query.dto';
import { NotificacionPresenter } from '../presenters/notificacion.presenter';

/** Bandeja de notificaciones de quien tiene la sesión: cada uno ve solo la suya. */
@ApiTags('notificaciones')
@Controller('notificaciones')
export class NotificacionController {
  constructor(
    private readonly listar: ListarNotificacionesUseCase,
    private readonly contar: ContarNotificacionesUseCase,
    private readonly marcarLeida: MarcarNotificacionLeidaUseCase,
    private readonly marcarLeidas: MarcarNotificacionesLeidasUseCase,
    private readonly descartarUna: DescartarNotificacionUseCase,
    private readonly descartarTodas: DescartarNotificacionesUseCase,
  ) {}

  @Get()
  async bandeja(
    @Query() q: ListarNotificacionesQueryDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.listar.execute({
      usuarioId: actor.usuarioId,
      page: q.page,
      limit: q.limit,
      filtros: {
        categorias: q.categorias,
        severidades: q.severidades,
        soloNoLeidas: q.noLeidas,
        desde: q.desde,
        hasta: q.hasta,
        search: q.search,
        sortDir: q.sortDir,
      },
    });

    return NotificacionPresenter.bandeja(resultado);
  }

  @Get('contadores')
  async contadores(@Actor() actor: ActorHttp) {
    return NotificacionPresenter.contadores(
      await this.contar.execute({ usuarioId: actor.usuarioId }),
    );
  }

  @Post('leer-todas')
  @HttpCode(HttpStatus.OK)
  async leerTodas(@Actor() actor: ActorHttp) {
    return NotificacionPresenter.marcadas(
      await this.marcarLeidas.execute({ usuarioId: actor.usuarioId }),
    );
  }

  @Post('descartar-todas')
  @HttpCode(HttpStatus.OK)
  async descartarTodasLasNotificaciones(@Actor() actor: ActorHttp) {
    return NotificacionPresenter.descartadas(
      await this.descartarTodas.execute({ usuarioId: actor.usuarioId }),
    );
  }

  @Post(':notificacionId/leer')
  @HttpCode(HttpStatus.OK)
  async leer(
    @Param('notificacionId', ParseIntPipe) notificacionId: number,
    @Actor() actor: ActorHttp,
  ) {
    return NotificacionPresenter.accion(
      await this.marcarLeida.execute({
        usuarioId: actor.usuarioId,
        notificacionId,
      }),
    );
  }

  @Delete(':notificacionId')
  async descartar(
    @Param('notificacionId', ParseIntPipe) notificacionId: number,
    @Actor() actor: ActorHttp,
  ) {
    return NotificacionPresenter.accion(
      await this.descartarUna.execute({
        usuarioId: actor.usuarioId,
        notificacionId,
      }),
    );
  }
}
