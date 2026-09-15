export type TicketHistorialCampo =
  | 'titulo'
  | 'descripcion'
  | 'estado'
  | 'prioridad'
  | 'cliente'
  | 'tecnicoPrincipal'
  | 'tecnicosAdicionales'
  | 'etiquetas'
  | 'fijado'
  | 'otro';

export type TicketHistorialValorEscalar = string | number | boolean | null;

export type TicketHistorialValor =
  | TicketHistorialValorEscalar
  | readonly TicketHistorialValorEscalar[];

/**
 * Representación tipada y transitoria de un cambio.
 *
 * IMPORTANTE:
 * El schema actual no persiste JSON. Estos cambios se usan solamente
 * para construir una descripción legible antes de guardar la auditoría.
 */
export type TicketHistorialCambio = {
  campo: TicketHistorialCampo;
  anterior: TicketHistorialValor;
  nuevo: TicketHistorialValor;

  /** Etiqueta opcional para reemplazar el nombre técnico del campo. */
  etiqueta?: string;
};

export type TicketHistorialActor = {
  usuarioId?: number | null;

  /**
   * Snapshot del nombre al momento de la acción.
   * Se conserva aunque la relación al Usuario desaparezca después.
   */
  usuarioNombre?: string | null;
};
