import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';

/** Fechas siempre en ISO 8601. */

export class TrackingInicioResponseDto {
  sesionTrackingId: number;
  asistenciaId: number;
  estado: EstadoTrackingTecnico;
  iniciadoEn: string;
  ultimoHeartbeatEn: string;
}

export class TrackingEstadoTecnicoResponseDto {
  /** Si el técnico tiene un tracking activo. */
  activo: boolean;

  sesionTrackingId: number | null;
  asistenciaId: number | null;
  estado: EstadoTrackingTecnico | null;
  iniciadoEn: string | null;
  ultimoHeartbeatEn: string | null;
}

export class TrackingUbicacionRegistradaResponseDto {
  ubicacionId: number;
  sesionTrackingId: number;
  estado: EstadoTrackingTecnico;

  /** Cuando el dispositivo capturó el punto. */
  capturadoEn: string;

  /** Cuando el servidor lo recibió. */
  recibidoEn: string;

  ultimoHeartbeatEn: string;
}

export class TrackingFinalizadoResponseDto {
  sesionTrackingId: number;
  asistenciaId: number;
  estado: EstadoTrackingTecnico;
  iniciadoEn: string;
  finalizadoEn: string;
  ultimoHeartbeatEn: string;

  /** Tiempo confirmado de la sesión. */
  duracionMinutos: number;

  horaEntrada: string;
  horaSalida: string;
}

export class TrackingTecnicoResponseDto {
  id: number;
  nombre: string;
  telefono: string | null;
  rol: string;
  avatarUrl: string | null;
}

export class TrackingTecnicoResumenResponseDto extends TrackingTecnicoResponseDto {
  activo: boolean;
}

export class TrackingResumenSesionesResponseDto {
  sesionesTotal: number;
  sesionesFinalizadas: number;
  sesionesExpiradas: number;
  haySesionActiva: boolean;
  primeraActivacion: string | null;
  ultimaFinalizacion: string | null;
  ultimoHeartbeatEn: string | null;

  /** Tiempo confirmado de tracking (derivado, no persistido). */
  minutosTracking: number;
}

export class TrackingHistorialItemResponseDto {
  asistenciaId: number;
  fecha: string;
  horaEntrada: string;
  horaSalida: string | null;
  tecnico: TrackingTecnicoResumenResponseDto;
  asistencia: { minutosTarde: number | null; trabajoCompleto: boolean };
  tracking: TrackingResumenSesionesResponseDto;
}

export class TrackingPuntoResponseDto {
  latitud: number;
  longitud: number;
  capturadoEn: string | null;
}

export class TrackingSesionDetalleResponseDto {
  id: number;
  estado: EstadoTrackingTecnico;
  iniciadoEn: string;
  finalizadoEn: string | null;
  ultimoHeartbeatEn: string;
  duracionMinutos: number;
  puntosRegistrados: number;
  bateriaInicial: number | null;
  bateriaFinal: number | null;
  primeraUbicacion: TrackingPuntoResponseDto | null;
  ultimaUbicacion: TrackingPuntoResponseDto | null;
}

export class TrackingAsistenciaDetalleResponseDto {
  asistencia: {
    id: number;
    fecha: string;
    horaEntrada: string;
    horaSalida: string | null;
    minutosTarde: number | null;
    trabajoCompleto: boolean;
  };
  tecnico: TrackingTecnicoResumenResponseDto;
  resumen: TrackingResumenSesionesResponseDto & {
    minutosJornada: number | null;
    minutosSinTracking: number | null;
  };
  sesiones: TrackingSesionDetalleResponseDto[];
}

export class TrackingUbicacionItemResponseDto {
  id: number;
  sesionTrackingId: number | null;
  latitud: number;
  longitud: number;
  precision: number | null;
  velocidad: number | null;
  bateria: number | null;
  capturadoEn: string | null;
  recibidoEn: string;
}

export class TrackingRealtimeResponseDto {
  tecnico: TrackingTecnicoResponseDto;
  tracking: {
    sesionId: number;
    asistenciaId: number;
    minutosSesionActual: number;
    estado: EstadoTrackingTecnico;
    iniciadoEn: string;
    ultimoHeartbeatEn: string;
  };
  jornada: {
    fecha: string;
    horaEntrada: string;
    horaSalida: string;
    sesionesTotal: number;
    sesionesFinalizadas: number;
    sesionesExpiradas: number;
    minutosTracking: number;
    minutosJornadaConfirmados: number;
    minutosSinTrackingConfirmados: number;
  };
  ubicacion: {
    latitud: number;
    longitud: number;
    precision: number | null;
    velocidad: number | null;
    bateria: number | null;
    capturadoEn: string | null;
    recibidoEn: string;
  } | null;
  actividad: {
    ticketsEnProceso: {
      id: number;
      titulo: string | null;
      estado: string;
      prioridad: string;
    }[];
  };
}
