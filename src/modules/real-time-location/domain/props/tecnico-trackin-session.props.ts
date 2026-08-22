// UBICACION TECNICO

export type UbicacionTecnicoProps = {
  id?: number;

  tecnicoId: number;

  /**
   * Nullable únicamente para poder hidratar
   * registros históricos anteriores al nuevo
   * flujo de tracking.
   *
   * Toda ubicación nueva debe pertenecer
   * obligatoriamente a una sesión.
   */
  sesionTrackingId?: number | null;

  latitud: number;
  longitud: number;

  precision?: number | null;
  velocidad?: number | null;
  bateria?: number | null;

  /**
   * Instante informado por el dispositivo
   * en el que fue obtenida la coordenada.
   *
   * Puede ser null únicamente al hidratar
   * información legacy.
   */
  capturadoEn?: Date | null;

  /**
   * Instante de persistencia en backend.
   */
  creadoEn?: Date;

  actualizadoEn?: Date;
};

export type CrearUbicacionTecnicoProps = {
  tecnicoId: number;

  /**
   * En el flujo nuevo ninguna ubicación
   * puede existir fuera de una sesión.
   */
  sesionTrackingId: number;

  latitud: number;
  longitud: number;

  precision?: number | null;
  velocidad?: number | null;
  bateria?: number | null;

  /**
   * Debe ser enviado por la APK.
   */
  capturadoEn: Date;
};
