import { EstadoTicket } from '../enums/estado-ticket.enum';
import { PrioridadTicket } from '../enums/prioridad-ticket.enum';

export type TicketProps = {
  id: number | null;
  empresaId: number | null;
  clienteId: number | null;
  creadoPorId: number | null;
  titulo: string | null;
  descripcion: string | null;
  prioridad: PrioridadTicket;
  estado: EstadoTicket;
  fijado: boolean;
  /** Técnico principal. */
  tecnicoId: number | null;
  /** Técnicos de apoyo, sin el principal. */
  apoyoIds: number[];
  etiquetaIds: number[];
  fechaApertura: Date;
  fechaAsignacion: Date | null;
  fechaInicioAtencion: Date | null;
  fechaResolucionTecnico: Date | null;
  fechaCierre: Date | null;
  canceladoEn: Date | null;
  canceladoPorId: number | null;
  motivoCancelacion: string | null;
  actualizadoEn: Date;
};

export type CrearTicketProps = {
  empresaId: number | null;
  clienteId?: number | null;
  creadoPorId?: number | null;
  titulo: string;
  descripcion?: string | null;
  prioridad?: PrioridadTicket;
  fijado?: boolean;
  tecnicoId?: number | null;
  apoyoIds?: number[];
  etiquetaIds?: number[];
};

/** Datos que la oficina puede editar; lo que no llega no cambia. */
export type CambiosTicket = {
  titulo?: string;
  descripcion?: string | null;
  prioridad?: PrioridadTicket;
  fijado?: boolean;
  clienteId?: number | null;
  tecnicoId?: number | null;
  apoyoIds?: number[];
  etiquetaIds?: number[];
};
