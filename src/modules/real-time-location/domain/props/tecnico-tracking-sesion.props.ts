import { EstadoTrackingTecnico } from '../enums/estado-tracking-tecnico.enum';

export type TecnicoTrackingSesionProps = {
  id?: number;

  tecnicoId: number;

  /**
   * Solo es null al hidratar registros históricos: toda sesión nueva nace con
   * asistencia (TRACKER ON = asistencia iniciada o reanudada).
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
  asistenciaId: number;
  iniciadoEn: Date;
};
