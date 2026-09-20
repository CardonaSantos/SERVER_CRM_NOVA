import { EstadoTrackingTecnico } from '../enums/estado-tracking-tecnico.enum';

// TECNICO TRACKING SESION

export type TecnicoTrackingSesionProps = {
  id?: number;

  tecnicoId: number;

  /**
   * Nullable únicamente para permitir hidratación
   * de registros legacy o casos de integridad histórica.
   *
   * Toda sesión NUEVA creada por el flujo actual
   * debe poseer asistenciaId.
   */
  asistenciaId?: number | null;

  iniciadoEn: Date;
  finalizadoEn?: Date | null;

  ultimoHeartbeatEn: Date;

  estado: EstadoTrackingTecnico;

  creadoEn?: Date;
  actualizadoEn?: Date;
};

export type CrearTecnicoTrackingSesionProps = {
  tecnicoId: number;

  /**
   * En el flujo nuevo es obligatorio porque:
   *
   * TRACKER ON = asistencia iniciada/reanudada.
   */
  asistenciaId: number;

  iniciadoEn?: Date;
};

export type RegistrarHeartbeatTrackingParams = {
  ocurridoEn?: Date;
};

export type FinalizarTecnicoTrackingParams = {
  finalizadoEn?: Date;
};

// UBICACION HISTORICA

export type UbicacionTecnicoProps = {
  id?: number;

  tecnicoId: number;

  /**
   * Nullable únicamente para registros históricos anteriores
   * al nuevo flujo de sesiones.
   *
   * Las ubicaciones nuevas siempre deben pertenecer
   * a una sesión activa.
   */
  sesionTrackingId?: number | null;

  latitud: number;
  longitud: number;

  precision?: number | null;
  velocidad?: number | null;
  bateria?: number | null;

  /**
   * Momento en que el dispositivo capturó el punto GPS.
   *
   * Puede ser null al hidratar registros legacy.
   */
  capturadoEn?: Date | null;

  /**
   * Momento de persistencia/recepción en backend.
   */
  creadoEn?: Date;

  actualizadoEn?: Date;
};

export type CrearUbicacionTecnicoProps = {
  tecnicoId: number;

  /**
   * Obligatorio para toda ubicación del flujo nuevo.
   */
  sesionTrackingId: number;

  latitud: number;
  longitud: number;

  precision?: number | null;
  velocidad?: number | null;
  bateria?: number | null;

  /**
   * En nuevas ubicaciones lo exigiremos.
   * Vendrá desde la APK.
   */
  capturadoEn: Date;
};
