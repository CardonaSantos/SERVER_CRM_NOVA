import { AccionTicket } from '../../domain/enums/accion-ticket.enum';
import { FaseTicket } from '../../domain/enums/fase-ticket.enum';
import { PrioridadTicket } from '../../domain/enums/prioridad-ticket.enum';

export class PersonaTicketResponseDto {
  id: number;
  nombre: string;
}

export class ClienteTicketResponseDto {
  id: number;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  sector: PersonaTicketResponseDto | null;
  ubicacion: { latitud: number; longitud: number } | null;
}

export class TicketResponseDto {
  id: number;
  titulo: string | null;
  descripcion: string | null;
  estado: FaseTicket;
  prioridad: PrioridadTicket;
  fijado: boolean;
  cliente: ClienteTicketResponseDto | null;
  /** Técnico principal. */
  tecnico: PersonaTicketResponseDto | null;
  apoyos: PersonaTicketResponseDto[];
  etiquetas: PersonaTicketResponseDto[];
  /** `null`: lo creó el bot. */
  creadoPor: PersonaTicketResponseDto | null;
  abiertoEn: string;
  cerradoEn: string | null;
  ultimaActividadEn: string;
  totalComentarios: number;
  totalImagenes: number;
}

export class ClienteDetalleTicketResponseDto extends ClienteTicketResponseDto {
  telefonoReferencia: string | null;
  municipio: string | null;
  departamento: string | null;
  observaciones: string | null;
  archivos: Array<{
    id: number;
    url: string;
    titulo: string | null;
    descripcion: string | null;
    creadoEn: string;
  }>;
}

export class ResumenTicketResponseDto {
  solucion: PersonaTicketResponseDto | null;
  resueltoComo: string | null;
  notasInternas: string | null;
  tiempoTotalMinutos: number | null;
  /** `null`: sin registro de trabajo. */
  tiempoTecnicoMinutos: number | null;
  numeroReaperturas: number;
}

export class TicketDetalleResponseDto extends TicketResponseDto {
  declare cliente: ClienteDetalleTicketResponseDto | null;
  descripcion: string | null;
  fechas: {
    asignadoEn: string | null;
    iniciadoEn: string | null;
    entregadoEn: string | null;
  };
  cancelacion: {
    fecha: string;
    motivo: string | null;
    por: PersonaTicketResponseDto | null;
  } | null;
  resumen: ResumenTicketResponseDto | null;
  tiempoTrabajado: {
    /** `null`: sin registro. */
    minutos: number | null;
    /** Con valor mientras el reloj corre. */
    corriendoDesde: string | null;
  };
  /** Lo que este usuario puede hacer ahora. */
  acciones: AccionTicket[];
  /** Edita título, descripción, prioridad, cliente y etiquetas. */
  puedeEditar: boolean;
  /** Asigna técnicos y fija. */
  puedeAsignar: boolean;
}

export class ContadoresTicketResponseDto {
  activos: number;
  abiertos: number;
  enProceso: number;
  enRevision: number;
  resueltos: number;
  cancelados: number;
  todos: number;
}
