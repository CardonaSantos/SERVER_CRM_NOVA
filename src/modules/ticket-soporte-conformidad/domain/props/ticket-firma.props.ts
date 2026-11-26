import { TicketFirmaOrigen } from '../enums/ticket-firma-origen.enum';
import { TicketFirmaTipo } from '../enums/ticket-firma-tipo.enum';

export interface TicketFirmaProps {
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

export interface CrearTicketFirmaClienteProps {
  conformidadId: number;
  mediaId: number;

  nombreFirmante: string;
  telefonoFirmante: string;

  origen: TicketFirmaOrigen;

  ipOrigen?: string | null;
  userAgent?: string | null;
}

export interface CrearTicketFirmaTecnicoProps {
  conformidadId: number;
  mediaId: number;

  usuarioFirmanteId: number;
  nombreFirmante: string;

  ipOrigen?: string | null;
  userAgent?: string | null;
}
