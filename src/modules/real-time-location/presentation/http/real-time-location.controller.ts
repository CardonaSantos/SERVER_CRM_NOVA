import {
  Body,
  Controller,
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
import { FinalizarTecnicoTrackingUseCase } from '../../application/use-cases/finalizar-tecnico-tracking.use-case';
import { IniciarTecnicoTrackingUseCase } from '../../application/use-cases/iniciar-tecnico-tracking.use-case';
import { ListarHistorialTecnicoTrackingUseCase } from '../../application/use-cases/listar-historial-tecnico-tracking.use-case';
import { ListarTecnicosTrackingRealtimeUseCase } from '../../application/use-cases/listar-tecnicos-tracking-realtime.use-case';
import { ListarUbicacionesAsistenciaTrackingUseCase } from '../../application/use-cases/listar-ubicaciones-asistencia-tracking.use-case';
import { ObtenerDetalleAsistenciaTrackingUseCase } from '../../application/use-cases/obtener-detalle-asistencia-tracking.use-case';
import { ObtenerEstadoTrackingTecnicoUseCase } from '../../application/use-cases/obtener-estado-tracking-tecnico.use-case';
import { RegistrarUbicacionTecnicoUseCase } from '../../application/use-cases/registrar-ubicacion-tecnico.use-case';
import { ListarHistorialTrackingQueryDto } from '../dto/listar-historial-tracking-query.dto';
import { ListarUbicacionesTrackingQueryDto } from '../dto/listar-ubicaciones-tracking-query.dto';
import { RegistrarUbicacionTecnicoDto } from '../dto/registrar-ubicacion-tecnico.dto';
import { RealTimeLocationPresenter } from '../presenters/real-time-location.presenter';

/**
 * Sin `@Roles`: basta una sesión (decisión del dueño, 26-nov-2026). Las acciones
 * de tracking siempre recaen sobre el usuario autenticado.
 */
@ApiTags('real-time-location')
@Controller('real-time-location')
export class RealTimeLocationController {
  constructor(
    private readonly iniciarTracking: IniciarTecnicoTrackingUseCase,
    private readonly obtenerEstadoTracking: ObtenerEstadoTrackingTecnicoUseCase,
    private readonly registrarUbicacion: RegistrarUbicacionTecnicoUseCase,
    private readonly finalizarTracking: FinalizarTecnicoTrackingUseCase,
    private readonly listarHistorial: ListarHistorialTecnicoTrackingUseCase,
    private readonly listarRealtime: ListarTecnicosTrackingRealtimeUseCase,
    private readonly obtenerDetalle: ObtenerDetalleAsistenciaTrackingUseCase,
    private readonly listarUbicaciones: ListarUbicacionesAsistenciaTrackingUseCase,
  ) {}

  /** El técnico enciende su tracking (inicia o reanuda su jornada). */
  @Post('tracking/start')
  async iniciar(@Actor() actor: ActorHttp) {
    return RealTimeLocationPresenter.inicio(
      await this.iniciarTracking.execute({ tecnicoId: actor.usuarioId }),
    );
  }

  /** Estado actual del tracking del técnico autenticado. */
  @Get('tracking/me')
  async miEstado(@Actor() actor: ActorHttp) {
    return RealTimeLocationPresenter.estadoTecnico(
      await this.obtenerEstadoTracking.execute({ tecnicoId: actor.usuarioId }),
    );
  }

  /** Punto GPS y heartbeat del técnico. */
  @Post('tracking/location')
  async registrarPunto(
    @Actor() actor: ActorHttp,
    @Body() dto: RegistrarUbicacionTecnicoDto,
  ) {
    return RealTimeLocationPresenter.ubicacionRegistrada(
      await this.registrarUbicacion.execute({
        tecnicoId: actor.usuarioId,
        sesionTrackingId: dto.sesionTrackingId,
        latitud: dto.latitud,
        longitud: dto.longitud,
        precision: dto.precision ?? null,
        velocidad: dto.velocidad ?? null,
        bateria: dto.bateria ?? null,
        capturadoEn: new Date(dto.capturadoEn),
      }),
    );
  }

  /** El técnico apaga su tracking. */
  @Post('tracking/:sesionTrackingId/finish')
  @HttpCode(HttpStatus.OK)
  async finalizar(
    @Actor() actor: ActorHttp,
    @Param('sesionTrackingId', ParseIntPipe) sesionTrackingId: number,
  ) {
    return RealTimeLocationPresenter.finalizado(
      await this.finalizarTracking.execute({
        tecnicoId: actor.usuarioId,
        sesionTrackingId,
      }),
    );
  }

  /** Mapa: técnicos con tracking activo. */
  @Get('tracking/realtime')
  async tecnicosEnVivo() {
    return RealTimeLocationPresenter.realtimeLista(
      await this.listarRealtime.execute(),
    );
  }

  /** Jornadas con su resumen de tracking. */
  @Get('tracking/history')
  async historial(@Query() query: ListarHistorialTrackingQueryDto) {
    return RealTimeLocationPresenter.historial(
      await this.listarHistorial.execute({
        page: query.page,
        limit: query.limit,
        search: query.search,
        tecnicoId: query.tecnicoId,
        fechaDesde: query.fechaDesde,
        fechaHasta: query.fechaHasta,
        estadoSesion: query.estadoSesion,
      }),
    );
  }

  /** Detalle de una jornada con sus sesiones. */
  @Get('tracking/attendance/:asistenciaId')
  async detalleJornada(
    @Param('asistenciaId', ParseIntPipe) asistenciaId: number,
  ) {
    return RealTimeLocationPresenter.detalleAsistencia(
      await this.obtenerDetalle.execute({ asistenciaId }),
    );
  }

  /** Recorrido GPS de una jornada. */
  @Get('tracking/attendance/:asistenciaId/locations')
  async recorrido(
    @Param('asistenciaId', ParseIntPipe) asistenciaId: number,
    @Query() query: ListarUbicacionesTrackingQueryDto,
  ) {
    return RealTimeLocationPresenter.ubicaciones(
      await this.listarUbicaciones.execute({
        asistenciaId,
        sesionTrackingId: query.sesionTrackingId,
        page: query.page,
        limit: query.limit,
      }),
    );
  }
}
