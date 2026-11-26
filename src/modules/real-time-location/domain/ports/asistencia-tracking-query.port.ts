export type AsistenciaTrackingRecord = {
  id: number;

  tecnicoId: number;

  fecha: Date;

  horaEntrada: Date;
  horaSalida: Date | null;

  minutosTarde: number | null;

  trabajoCompleto: boolean;

  creadoEn: Date | null;
  actualizadoEn: Date;
};

export const ASISTENCIA_TRACKING_QUERY = Symbol('ASISTENCIA_TRACKING_QUERY');

export interface AsistenciaTrackingQueryPort {
  findByTechnicianAndDate(params: {
    tecnicoId: number;
    fecha: Date;
  }): Promise<AsistenciaTrackingRecord | null>;

  findById(id: number): Promise<AsistenciaTrackingRecord | null>;
}
