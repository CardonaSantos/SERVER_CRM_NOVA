export type MetaTicketProps = {
  id: number | null;
  tecnicoId: number;
  titulo: string | null;
  /** `YYYY-MM-DD`, día de Guatemala. Ambos extremos entran en la meta. */
  fechaInicio: string;
  fechaFin: string;
  /** Tickets a resolver. */
  objetivo: number;
  cancelada: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
};

export type CrearMetaTicketProps = {
  tecnicoId: number;
  titulo?: string | null;
  fechaInicio: string;
  fechaFin: string;
  objetivo: number;
};

export type CambiosMetaTicket = {
  /** `null` quita el título. */
  titulo?: string | null;
  fechaInicio?: string;
  fechaFin?: string;
  objetivo?: number;
};
