import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Body,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';

import { GetUserAuthToken } from 'src/CustomDecoratorAuthToken/GetUserAuthToken';

import { FinalizarTecnicoTrackingUseCase } from '../../application/use-cases/finalizar-tecnico-tracking.use-case';

import { IniciarTecnicoTrackingUseCase } from '../../application/use-cases/iniciar-tecnico-tracking.use-case';

import { ListarHistorialTecnicoTrackingUseCase } from '../../application/use-cases/listar-historial-tecnico-tracking.use-case';

import { ListarUbicacionesAsistenciaTrackingUseCase } from '../../application/use-cases/listar-ubicaciones-asistencia-tracking.use-case';

import { ObtenerDetalleAsistenciaTrackingUseCase } from '../../application/use-cases/obtener-detalle-asistencia-tracking.use-case';

import { RegistrarUbicacionTecnicoUseCase } from '../../application/use-cases/registrar-ubicacion-tecnico.use-case';

import { TrackingAuthUser } from '../types/tracking-auth-user.type';
import { RegistrarUbicacionTecnicoDto } from '../../application/dto/registrar-ubicacion-tecnico.dto';
import { ListarHistorialTrackingQueryDto } from '../../application/dto/listar-historial-tracking.query.dto';
import { ListarUbicacionesTrackingQueryDto } from '../../application/dto/listar-ubicaciones-tracking.query.dto';

@Controller('real-time-location')
@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,

    whitelist: true,

    forbidNonWhitelisted: true,
  }),
)
export class RealTimeLocationController {
  constructor(
    private readonly iniciarTracking: IniciarTecnicoTrackingUseCase,

    private readonly registrarUbicacion: RegistrarUbicacionTecnicoUseCase,

    private readonly finalizarTracking: FinalizarTecnicoTrackingUseCase,

    private readonly listarHistorial: ListarHistorialTecnicoTrackingUseCase,

    private readonly obtenerDetalle: ObtenerDetalleAsistenciaTrackingUseCase,

    private readonly listarUbicaciones: ListarUbicacionesAsistenciaTrackingUseCase,
  ) {}

  // =====================================================
  // TECNICO - ENCENDER TRACKING
  // =====================================================

  @Post('tracking/start')
  async startTracking(
    @GetUserAuthToken()
    auth: TrackingAuthUser,
  ) {
    return this.iniciarTracking.execute({
      tecnicoId: auth.id,

      actorRol: auth.rol,
    });
  }

  // =====================================================
  // TECNICO - GPS / HEARTBEAT
  // =====================================================

  @Post('tracking/location')
  async registerLocation(
    @GetUserAuthToken()
    auth: TrackingAuthUser,

    @Body()
    body: RegistrarUbicacionTecnicoDto,
  ) {
    return this.registrarUbicacion.execute({
      tecnicoId: auth.id,

      actorRol: auth.rol,

      sesionTrackingId: body.sesionTrackingId,

      latitud: body.latitud,

      longitud: body.longitud,

      precision: body.precision ?? null,

      velocidad: body.velocidad ?? null,

      bateria: body.bateria ?? null,

      capturadoEn: body.capturadoEn,
    });
  }

  // TECNICO - APAGAR TRACKING

  @Post('tracking/:sesionTrackingId/finish')
  @HttpCode(HttpStatus.OK)
  async finishTracking(
    @GetUserAuthToken()
    auth: TrackingAuthUser,

    @Param('sesionTrackingId', ParseIntPipe)
    sesionTrackingId: number,
  ) {
    return this.finalizarTracking.execute({
      tecnicoId: auth.id,

      actorRol: auth.rol,

      sesionTrackingId,
    });
  }

  // =====================================================
  // ADMINISTRACION - HISTORICO
  // =====================================================

  @Get('tracking/history')
  async getHistory(
    @Query()
    query: ListarHistorialTrackingQueryDto,
  ) {
    return this.listarHistorial.execute({
      page: query.page,

      limit: query.limit,

      search: query.search,

      tecnicoId: query.tecnicoId,

      fechaDesde: query.fechaDesde,

      fechaHasta: query.fechaHasta,

      estadoSesion: query.estadoSesion,
    });
  }
  // ADMINISTRACION - DETALLE DE JORNADA

  @Get('tracking/attendance/:asistenciaId')
  async getAttendanceDetail(
    @Param('asistenciaId', ParseIntPipe)
    asistenciaId: number,
  ) {
    return this.obtenerDetalle.execute({
      asistenciaId,
    });
  }

  // ADMINISTRACION - RECORRIDO GPS

  @Get('tracking/attendance/:asistenciaId/locations')
  async getAttendanceLocations(
    @Param('asistenciaId', ParseIntPipe)
    asistenciaId: number,

    @Query()
    query: ListarUbicacionesTrackingQueryDto,
  ) {
    return this.listarUbicaciones.execute({
      asistenciaId,

      sesionTrackingId: query.sesionTrackingId,

      page: query.page,

      limit: query.limit,
    });
  }
}
