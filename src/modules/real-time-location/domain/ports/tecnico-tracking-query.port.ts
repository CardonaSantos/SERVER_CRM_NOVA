import { EstadoTrackingTecnico } from '../enums/estado-tracking-tecnico.enum';

// TECNICO

export type TecnicoTrackingTecnicoResumen = {
  id: number;

  nombre: string;

  correo: string | null;
  telefono: string | null;

  rol: string;

  avatarUrl: string | null;

  activo: boolean;
};

// HISTORICO - FILTROS

export type TecnicoTrackingHistorialFilters = {
  page: number;
  limit: number;

  /**
   * Nombre, correo o teléfono del técnico.
   */
  search?: string | null;

  tecnicoId?: number | null;

  fechaDesde?: Date | null;
  fechaHasta?: Date | null;

  /**
   * Permite, por ejemplo, buscar jornadas
   * que tuvieron al menos una sesión EXPIRADA.
   */
  estadoSesion?: EstadoTrackingTecnico | null;
};

export type TecnicoTrackingHistorialListItem = {
  asistenciaId: number;

  fecha: Date;

  horaEntrada: Date;
  horaSalida: Date | null;

  tecnico: TecnicoTrackingTecnicoResumen;

  asistencia: {
    minutosTarde: number | null;
    trabajoCompleto: boolean;
  };

  tracking: {
    sesionesTotal: number;

    sesionesFinalizadas: number;
    sesionesExpiradas: number;

    haySesionActiva: boolean;

    primeraActivacion: Date | null;
    ultimaFinalizacion: Date | null;

    ultimoHeartbeatEn: Date | null;

    /**
     * Derivado. Nunca persistido.
     */
    minutosTracking: number;
  };
};

// detalles

export type TecnicoTrackingSesionDetalle = {
  id: number;

  estado: EstadoTrackingTecnico;

  iniciadoEn: Date;
  finalizadoEn: Date | null;

  ultimoHeartbeatEn: Date;

  /**
   * Tiempo confirmado de tracking.
   *
   * FINALIZADA / EXPIRADA:
   * finalizadoEn - iniciadoEn.
   *
   * ACTIVA:
   * ultimoHeartbeatEn - iniciadoEn.
   *
   * Nunca se extiende artificialmente hasta "ahora".
   */
  duracionMinutos: number;

  puntosRegistrados: number;

  bateriaInicial: number | null;
  bateriaFinal: number | null;

  primeraUbicacion: {
    latitud: number;
    longitud: number;
    capturadoEn: Date | null;
  } | null;

  ultimaUbicacion: {
    latitud: number;
    longitud: number;
    capturadoEn: Date | null;
  } | null;
};

export type TecnicoTrackingAsistenciaDetalle = {
  asistencia: {
    id: number;

    fecha: Date;

    horaEntrada: Date;
    horaSalida: Date | null;

    minutosTarde: number | null;

    trabajoCompleto: boolean;
  };

  tecnico: TecnicoTrackingTecnicoResumen;

  resumen: {
    sesionesTotal: number;

    sesionesFinalizadas: number;
    sesionesExpiradas: number;

    haySesionActiva: boolean;

    primeraActivacion: Date | null;
    ultimaFinalizacion: Date | null;

    ultimoHeartbeatEn: Date | null;

    /**
     * Tiempo confirmado de tracking.
     *
     * FINALIZADA / EXPIRADA:
     * finalizadoEn - iniciadoEn.
     *
     * ACTIVA:
     * ultimoHeartbeatEn - iniciadoEn.
     *
     * Nunca se extiende artificialmente hasta "ahora".
     */
    minutosTracking: number;

    /**
     * Solo puede calcularse completamente
     * cuando existe una horaSalida.
     */
    minutosJornada: number | null;

    minutosSinTracking: number | null;
  };

  sesiones: TecnicoTrackingSesionDetalle[];
};

// OTROS
export type TecnicoTrackingUbicacionListItem = {
  id: number;

  sesionTrackingId: number | null;

  latitud: number;
  longitud: number;

  precision: number | null;
  velocidad: number | null;

  bateria: number | null;

  capturadoEn: Date | null;

  /**
   * UbicacionTecnico.creadoEn
   */
  recibidoEn: Date;
};

export type TecnicoTrackingUbicacionesFilters = {
  asistenciaId: number;

  sesionTrackingId?: number | null;

  page: number;
  limit: number;
};

export type TecnicoTrackingUbicacionesPaginatedResult = {
  items: TecnicoTrackingUbicacionListItem[];

  total: number;

  page: number;
  limit: number;

  totalPages: number;
};

export type TecnicoTrackingRealtimeView = {
  tecnico: {
    id: number;
    nombre: string;
    telefono: string | null;
    rol: string;
    avatarUrl: string | null;
  };

  tracking: {
    sesionId: number;

    // NUEVO
    asistenciaId: number;

    estado: EstadoTrackingTecnico;

    iniciadoEn: Date;
    ultimoHeartbeatEn: Date;
  };

  ubicacion: {
    latitud: number;
    longitud: number;

    precision: number | null;
    velocidad: number | null;

    bateria: number | null;

    capturadoEn: Date | null;
    recibidoEn: Date;
  } | null;

  actividad: {
    ticketsEnProceso: Array<{
      id: number;
      titulo: string | null;
      estado: string;
      prioridad: string;
    }>;
  };
};

export type TecnicoTrackingHistorialPaginatedResult = {
  items: TecnicoTrackingHistorialListItem[];

  total: number;

  page: number;
  limit: number;

  totalPages: number;
};
