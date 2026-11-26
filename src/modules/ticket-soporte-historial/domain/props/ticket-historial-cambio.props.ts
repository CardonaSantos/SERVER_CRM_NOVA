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
 * Cambio tipado y transitorio: solo sirve para armar la descripción legible
 * del evento. El esquema no guarda JSON.
 */
export type TicketHistorialCambio = {
  campo: TicketHistorialCampo;
  anterior: TicketHistorialValor;
  nuevo: TicketHistorialValor;

  /** Etiqueta opcional que reemplaza el nombre técnico del campo. */
  etiqueta?: string;
};

export type TicketHistorialActor = {
  usuarioId?: number | null;

  /** Nombre del usuario al momento de la acción; se conserva aunque el usuario se borre. */
  usuarioNombre?: string | null;
};
