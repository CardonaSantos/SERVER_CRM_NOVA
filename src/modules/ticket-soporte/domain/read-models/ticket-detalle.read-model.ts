import { CicloTrabajo } from '../policies/tiempos-ticket.policy';
import {
  ClienteDeTicket,
  PersonaTicket,
  TicketListItem,
} from './ticket-listado.read-model';

export type ArchivoClienteTicket = {
  id: number;
  url: string;
  titulo: string | null;
  descripcion: string | null;
  creadoEn: Date;
};

export type ClienteDetalleTicket = ClienteDeTicket & {
  telefonoReferencia: string | null;
  municipio: string | null;
  departamento: string | null;
  observaciones: string | null;
  /** Fotos del cliente (casa, equipos); no incluye las de tickets. */
  archivos: ArchivoClienteTicket[];
};

export type ResumenDeTicket = {
  solucion: { id: number; nombre: string } | null;
  resueltoComo: string | null;
  notasInternas: string | null;
  tiempoTotalMinutos: number | null;
  tiempoTecnicoMinutos: number | null;
  numeroReaperturas: number;
};

export type TicketDetalleReadModel = Omit<TicketListItem, 'cliente'> & {
  descripcion: string | null;
  cliente: ClienteDetalleTicket | null;
  fechaAsignacion: Date | null;
  fechaInicioAtencion: Date | null;
  fechaResolucionTecnico: Date | null;
  cancelacion: {
    fecha: Date;
    motivo: string | null;
    por: PersonaTicket | null;
  } | null;
  resumen: ResumenDeTicket | null;
  ciclos: CicloTrabajo[];
};
