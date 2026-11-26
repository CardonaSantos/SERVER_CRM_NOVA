export type UbicacionTecnicoProps = {
  id?: number;

  tecnicoId: number;

  /** Solo es null al hidratar ubicaciones anteriores al flujo de sesiones. */
  sesionTrackingId?: number | null;

  latitud: number;
  longitud: number;

  precision?: number | null;
  velocidad?: number | null;
  bateria?: number | null;

  /** Instante en que el dispositivo capturó el punto GPS (null solo en datos históricos). */
  capturadoEn?: Date | null;

  /** Momento en que el backend la recibió y guardó. */
  creadoEn?: Date;

  actualizadoEn?: Date;
};

export type CrearUbicacionTecnicoProps = {
  tecnicoId: number;

  /** Toda ubicación nueva pertenece a una sesión. */
  sesionTrackingId: number;

  latitud: number;
  longitud: number;

  precision?: number | null;
  velocidad?: number | null;
  bateria?: number | null;

  /** Lo informa la app del técnico. */
  capturadoEn: Date;
};
