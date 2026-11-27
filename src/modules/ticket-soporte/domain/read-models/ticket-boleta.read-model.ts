import { EstadoTicket } from '../enums/estado-ticket.enum';
import { PrioridadTicket } from '../enums/prioridad-ticket.enum';

export type FirmaBoleta = {
  id: number;
  nombreFirmante: string | null;
  telefonoFirmante: string | null;
  usuarioFirmanteId: number | null;
  firmadoEn: Date;
  url: string | null;
  mimeType: string | null;
};

export type TicketBoletaReadModel = {
  ticketId: number;
  titulo: string | null;
  descripcion: string | null;
  estado: EstadoTicket;
  prioridad: PrioridadTicket;
  fechaApertura: Date;
  fechaCierre: Date | null;
  asignados: number[];
  cliente: {
    id: number;
    nombre: string;
    telefono: string | null;
    direccion: string | null;
  } | null;
  tecnico: { id: number; nombre: string } | null;
  empresa: {
    id: number;
    nombre: string;
    direccion: string | null;
    correo: string | null;
    telefono: string | null;
    pbx: string | null;
  } | null;
  /** El ciclo de conformidad más reciente. */
  conformidad: {
    id: number;
    resultado: string;
    creadoEn: Date;
    respondidoEn: Date | null;
  } | null;
  firmaCliente: FirmaBoleta | null;
  firmaTecnico: FirmaBoleta | null;
};
