import { DireccionOrden } from 'src/common/hexagonal/paginacion';
import { BandejaTicket } from '../enums/bandeja-ticket.enum';
import { EstadoTicket } from '../enums/estado-ticket.enum';
import { CampoFechaTicket, OrdenTicket } from '../enums/orden-ticket.enum';
import { PrioridadTicket } from '../enums/prioridad-ticket.enum';

/** Filtros de la lista; sirven igual para los contadores de las bandejas. */
export type TicketFiltros = {
  bandeja?: BandejaTicket;
  /** Con búsqueda la bandeja se ignora: se busca en todos los estados. */
  search?: string;
  /** Restricción de visibilidad: solo los tickets de este usuario. */
  soloAsignadosA?: number;
  asignadoA?: number;
  creadoPorId?: number;
  tecnicoIds?: number[];
  sinTecnico?: boolean;
  sectorIds?: number[];
  etiquetaIds?: number[];
  prioridades?: PrioridadTicket[];
  clienteId?: number;
  fechaDe?: CampoFechaTicket;
  /** `YYYY-MM-DD`, día completo de Guatemala. */
  desde?: string;
  hasta?: string;
  sortBy?: OrdenTicket;
  sortDir?: DireccionOrden;
};

export type PersonaTicket = { id: number; nombre: string };

export type EtiquetaDeTicket = { id: number; nombre: string };

export type ClienteDeTicket = {
  id: number;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  sector: { id: number; nombre: string } | null;
  ubicacion: { latitud: number; longitud: number } | null;
};

export type TicketListItem = {
  id: number;
  titulo: string | null;
  descripcion: string | null;
  estado: EstadoTicket;
  prioridad: PrioridadTicket;
  fijado: boolean;
  cliente: ClienteDeTicket | null;
  tecnico: PersonaTicket | null;
  apoyos: PersonaTicket[];
  etiquetas: EtiquetaDeTicket[];
  creadoPor: PersonaTicket | null;
  fechaApertura: Date;
  fechaCierre: Date | null;
  ultimaActividadEn: Date;
  totalComentarios: number;
  totalImagenes: number;
};
