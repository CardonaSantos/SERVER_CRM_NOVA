import { TicketConformidadCanal } from '../enums/ticket-conformidad-canal.enum';
import { TicketConformidadResultado } from '../enums/ticket-conformidad-resultado.enum';
import { TicketFirmaOrigen } from '../enums/ticket-firma-origen.enum';
import { TicketFirmaTipo } from '../enums/ticket-firma-tipo.enum';

//  * TICKET CONFORMIDAD

export interface TicketConformidadEntityProps {
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

export interface CrearTicketConformidadEntityProps {
  ticketId: number;

  clienteId?: number | null;
  tecnicoAsignadoId?: number | null;
  creadoPorId?: number | null;
}

//  * TICKET FIRMA

export interface TicketFirmaEntityProps {
  id: number | null;

  conformidadId: number;
  mediaId: number;

  tipo: TicketFirmaTipo;

  usuarioFirmanteId: number | null;

  nombreFirmante: string;
  telefonoFirmante: string | null;

  origen: TicketFirmaOrigen;

  ipOrigen: string | null;
  userAgent: string | null;

  firmadoEn: Date;
}

export interface CrearTicketFirmaClienteEntityProps {
  conformidadId: number;
  mediaId: number;

  nombreFirmante: string;
  telefonoFirmante: string;

  origen: TicketFirmaOrigen;

  ipOrigen?: string | null;
  userAgent?: string | null;
}

export interface CrearTicketFirmaTecnicoEntityProps {
  conformidadId: number;
  mediaId: number;

  usuarioFirmanteId: number;
  nombreFirmante: string;

  ipOrigen?: string | null;
  userAgent?: string | null;
}

//  * TICKET CONFORMIDAD ENLACE

export interface TicketConformidadEnlaceEntityProps {
  id: number | null;

  conformidadId: number;

  tokenHash: string;

  canal: TicketConformidadCanal;

  telefonoDestino: string | null;

  expiraEn: Date;

  usadoEn: Date | null;
  revocadoEn: Date | null;

  creadoPorId: number | null;

  creadoEn: Date;
}

export interface CrearTicketConformidadEnlaceEntityProps {
  conformidadId: number;

  tokenHash: string;

  canal: TicketConformidadCanal;

  telefonoDestino?: string | null;

  expiraEn: Date;

  creadoPorId?: number | null;
}
