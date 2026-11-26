import { TicketSoporteHistorialTipo } from '../enums/ticket-soporte-historial-tipo.enum';

export type TicketSoporteHistorialProps = {
  id: number | null;
  ticketId: number;
  usuarioId: number | null;
  tipo: TicketSoporteHistorialTipo;
  descripcion: string | null;
  usuarioNombre: string | null;
  creadoEn: Date;
};

export type CrearTicketSoporteHistorialProps = Omit<
  TicketSoporteHistorialProps,
  'id' | 'creadoEn' | 'usuarioId'
> & {
  usuarioId?: number | null;
};
