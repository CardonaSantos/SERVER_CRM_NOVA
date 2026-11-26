import { TicketConformidadResultado } from '../enums/ticket-conformidad-resultado.enum';

export interface TicketConformidadProps {
  id: number | null;

  ticketId: number;
  clienteId: number | null;
  tecnicoAsignadoId: number | null;
  creadoPorId: number | null;

  resultado: TicketConformidadResultado;

  creadoEn: Date;
  actualizadoEn: Date;
  respondidoEn: Date | null;
}

export interface CrearTicketConformidadProps {
  ticketId: number;

  clienteId?: number | null;
  tecnicoAsignadoId?: number | null;
  creadoPorId?: number | null;
}
