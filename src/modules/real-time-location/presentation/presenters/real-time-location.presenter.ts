import {
  presentarPaginado,
  RespuestaPaginada,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { FinalizarTecnicoTrackingResult } from '../../application/use-cases/finalizar-tecnico-tracking.use-case';
import { IniciarTecnicoTrackingResult } from '../../application/use-cases/iniciar-tecnico-tracking.use-case';
import { ObtenerEstadoTrackingTecnicoResult } from '../../application/use-cases/obtener-estado-tracking-tecnico.use-case';
import { RegistrarUbicacionTecnicoResult } from '../../application/use-cases/registrar-ubicacion-tecnico.use-case';
import {
  TecnicoTrackingAsistenciaDetalle,
  TecnicoTrackingHistorialListItem,
  TecnicoTrackingRealtimeView,
  TecnicoTrackingSesionDetalle,
  TecnicoTrackingTecnicoResumen,
  TecnicoTrackingUbicacionListItem,
} from '../../domain/read-models/tecnico-tracking.read-model';
import {
  TrackingAsistenciaDetalleResponseDto,
  TrackingEstadoTecnicoResponseDto,
  TrackingFinalizadoResponseDto,
  TrackingHistorialItemResponseDto,
  TrackingInicioResponseDto,
  TrackingRealtimeResponseDto,
  TrackingSesionDetalleResponseDto,
  TrackingTecnicoResumenResponseDto,
  TrackingUbicacionItemResponseDto,
  TrackingUbicacionRegistradaResponseDto,
} from '../dto/real-time-location-response.dto';

const iso = (fecha: Date): string => fecha.toISOString();
const isoONull = (fecha: Date | null): string | null =>
  fecha ? fecha.toISOString() : null;

export class RealTimeLocationPresenter {
  static inicio(r: IniciarTecnicoTrackingResult): TrackingInicioResponseDto {
    return {
      sesionTrackingId: r.sesionTrackingId,
      asistenciaId: r.asistenciaId,
      estado: r.estado,
      iniciadoEn: iso(r.iniciadoEn),
      ultimoHeartbeatEn: iso(r.ultimoHeartbeatEn),
    };
  }

  static estadoTecnico(
    r: ObtenerEstadoTrackingTecnicoResult,
  ): TrackingEstadoTecnicoResponseDto {
    return {
      activo: r.activo,
      sesionTrackingId: r.sesionTrackingId,
      asistenciaId: r.asistenciaId,
      estado: r.estado,
      iniciadoEn: r.iniciadoEn ? iso(r.iniciadoEn) : null,
      ultimoHeartbeatEn: r.ultimoHeartbeatEn ? iso(r.ultimoHeartbeatEn) : null,
    };
  }

  static ubicacionRegistrada(
    r: RegistrarUbicacionTecnicoResult,
  ): TrackingUbicacionRegistradaResponseDto {
    return {
      ubicacionId: r.ubicacionId,
      sesionTrackingId: r.sesionTrackingId,
      estado: r.estado,
      capturadoEn: iso(r.capturadoEn),
      recibidoEn: iso(r.recibidoEn),
      ultimoHeartbeatEn: iso(r.ultimoHeartbeatEn),
    };
  }

  static finalizado(
    r: FinalizarTecnicoTrackingResult,
  ): TrackingFinalizadoResponseDto {
    return {
      sesionTrackingId: r.sesionTrackingId,
      asistenciaId: r.asistenciaId,
      estado: r.estado,
      iniciadoEn: iso(r.iniciadoEn),
      finalizadoEn: iso(r.finalizadoEn),
      ultimoHeartbeatEn: iso(r.ultimoHeartbeatEn),
      duracionMinutos: r.duracionMinutos,
      horaEntrada: iso(r.horaEntrada),
      horaSalida: iso(r.horaSalida),
    };
  }

  static historialItem(
    item: TecnicoTrackingHistorialListItem,
  ): TrackingHistorialItemResponseDto {
    return {
      asistenciaId: item.asistenciaId,
      fecha: iso(item.fecha),
      horaEntrada: iso(item.horaEntrada),
      horaSalida: isoONull(item.horaSalida),
      tecnico: RealTimeLocationPresenter.tecnicoResumen(item.tecnico),
      asistencia: {
        minutosTarde: item.asistencia.minutosTarde,
        trabajoCompleto: item.asistencia.trabajoCompleto,
      },
      tracking: RealTimeLocationPresenter.resumenSesiones(item.tracking),
    };
  }

  static historial(
    r: ResultadoPaginado<TecnicoTrackingHistorialListItem>,
  ): RespuestaPaginada<TrackingHistorialItemResponseDto> {
    return presentarPaginado(r, RealTimeLocationPresenter.historialItem);
  }

  static detalleAsistencia(
    d: TecnicoTrackingAsistenciaDetalle,
  ): TrackingAsistenciaDetalleResponseDto {
    return {
      asistencia: {
        id: d.asistencia.id,
        fecha: iso(d.asistencia.fecha),
        horaEntrada: iso(d.asistencia.horaEntrada),
        horaSalida: isoONull(d.asistencia.horaSalida),
        minutosTarde: d.asistencia.minutosTarde,
        trabajoCompleto: d.asistencia.trabajoCompleto,
      },
      tecnico: RealTimeLocationPresenter.tecnicoResumen(d.tecnico),
      resumen: {
        ...RealTimeLocationPresenter.resumenSesiones(d.resumen),
        minutosJornada: d.resumen.minutosJornada,
        minutosSinTracking: d.resumen.minutosSinTracking,
      },
      sesiones: d.sesiones.map((sesion) =>
        RealTimeLocationPresenter.sesion(sesion),
      ),
    };
  }

  static ubicacionItem(
    u: TecnicoTrackingUbicacionListItem,
  ): TrackingUbicacionItemResponseDto {
    return {
      id: u.id,
      sesionTrackingId: u.sesionTrackingId,
      latitud: u.latitud,
      longitud: u.longitud,
      precision: u.precision,
      velocidad: u.velocidad,
      bateria: u.bateria,
      capturadoEn: isoONull(u.capturadoEn),
      recibidoEn: iso(u.recibidoEn),
    };
  }

  static ubicaciones(
    r: ResultadoPaginado<TecnicoTrackingUbicacionListItem>,
  ): RespuestaPaginada<TrackingUbicacionItemResponseDto> {
    return presentarPaginado(r, RealTimeLocationPresenter.ubicacionItem);
  }

  static realtime(v: TecnicoTrackingRealtimeView): TrackingRealtimeResponseDto {
    return {
      tecnico: {
        id: v.tecnico.id,
        nombre: v.tecnico.nombre,
        telefono: v.tecnico.telefono,
        rol: v.tecnico.rol,
        avatarUrl: v.tecnico.avatarUrl,
      },
      tracking: {
        sesionId: v.tracking.sesionId,
        asistenciaId: v.tracking.asistenciaId,
        minutosSesionActual: v.tracking.minutosSesionActual,
        estado: v.tracking.estado,
        iniciadoEn: iso(v.tracking.iniciadoEn),
        ultimoHeartbeatEn: iso(v.tracking.ultimoHeartbeatEn),
      },
      jornada: {
        fecha: iso(v.jornada.fecha),
        horaEntrada: iso(v.jornada.horaEntrada),
        horaSalida: iso(v.jornada.horaSalida),
        sesionesTotal: v.jornada.sesionesTotal,
        sesionesFinalizadas: v.jornada.sesionesFinalizadas,
        sesionesExpiradas: v.jornada.sesionesExpiradas,
        minutosTracking: v.jornada.minutosTracking,
        minutosJornadaConfirmados: v.jornada.minutosJornadaConfirmados,
        minutosSinTrackingConfirmados: v.jornada.minutosSinTrackingConfirmados,
      },
      ubicacion: v.ubicacion
        ? {
            latitud: v.ubicacion.latitud,
            longitud: v.ubicacion.longitud,
            precision: v.ubicacion.precision,
            velocidad: v.ubicacion.velocidad,
            bateria: v.ubicacion.bateria,
            capturadoEn: isoONull(v.ubicacion.capturadoEn),
            recibidoEn: iso(v.ubicacion.recibidoEn),
          }
        : null,
      actividad: {
        ticketsEnProceso: v.actividad.ticketsEnProceso.map((t) => ({
          id: t.id,
          titulo: t.titulo,
          estado: t.estado,
          prioridad: t.prioridad,
        })),
      },
    };
  }

  static realtimeLista(
    vistas: TecnicoTrackingRealtimeView[],
  ): TrackingRealtimeResponseDto[] {
    return vistas.map((vista) => RealTimeLocationPresenter.realtime(vista));
  }

  private static tecnicoResumen(
    t: TecnicoTrackingTecnicoResumen,
  ): TrackingTecnicoResumenResponseDto {
    return {
      id: t.id,
      nombre: t.nombre,
      telefono: t.telefono,
      rol: t.rol,
      avatarUrl: t.avatarUrl,
      activo: t.activo,
    };
  }

  private static resumenSesiones(r: {
    sesionesTotal: number;
    sesionesFinalizadas: number;
    sesionesExpiradas: number;
    haySesionActiva: boolean;
    primeraActivacion: Date | null;
    ultimaFinalizacion: Date | null;
    ultimoHeartbeatEn: Date | null;
    minutosTracking: number;
  }) {
    return {
      sesionesTotal: r.sesionesTotal,
      sesionesFinalizadas: r.sesionesFinalizadas,
      sesionesExpiradas: r.sesionesExpiradas,
      haySesionActiva: r.haySesionActiva,
      primeraActivacion: isoONull(r.primeraActivacion),
      ultimaFinalizacion: isoONull(r.ultimaFinalizacion),
      ultimoHeartbeatEn: isoONull(r.ultimoHeartbeatEn),
      minutosTracking: r.minutosTracking,
    };
  }

  private static sesion(
    s: TecnicoTrackingSesionDetalle,
  ): TrackingSesionDetalleResponseDto {
    const punto = (p: TecnicoTrackingSesionDetalle['primeraUbicacion']) =>
      p
        ? {
            latitud: p.latitud,
            longitud: p.longitud,
            capturadoEn: isoONull(p.capturadoEn),
          }
        : null;

    return {
      id: s.id,
      estado: s.estado,
      iniciadoEn: iso(s.iniciadoEn),
      finalizadoEn: isoONull(s.finalizadoEn),
      ultimoHeartbeatEn: iso(s.ultimoHeartbeatEn),
      duracionMinutos: s.duracionMinutos,
      puntosRegistrados: s.puntosRegistrados,
      bateriaInicial: s.bateriaInicial,
      bateriaFinal: s.bateriaFinal,
      primeraUbicacion: punto(s.primeraUbicacion),
      ultimaUbicacion: punto(s.ultimaUbicacion),
    };
  }
}
