import { TicketConformidadResultado } from '../../domain/enums/ticket-conformidad-resultado.enum';
import { TicketFirmaOrigen } from '../../domain/enums/ticket-firma-origen.enum';
import { TicketFirmaTipo } from '../../domain/enums/ticket-firma-tipo.enum';

export class TicketConformidadPersonaResponseDto {
  /** Id del usuario. */
  id: number;

  /** Nombre visible. */
  nombre: string;
}

export class TicketConformidadClienteResponseDto {
  /** Id del cliente. */
  id: number;

  /** Nombre y apellidos. */
  nombreCompleto: string;

  /** Teléfono de contacto. */
  telefono: string | null;

  /** Dirección del servicio. */
  direccion: string | null;
}

export class TicketConformidadMediaResponseDto {
  /** Id de la media. */
  id: number;

  /** URL pública del archivo, si existe. */
  cdnUrl: string | null;

  /** Tipo MIME. */
  mimeType: string | null;
}

export class TicketConformidadTicketResponseDto {
  /** Id del ticket. */
  id: number;

  /** Estado actual del ticket. */
  estado: string;

  /** Prioridad actual. */
  prioridad: string;

  /** Título del ticket. */
  titulo: string | null;

  /** Descripción del ticket. */
  descripcion: string | null;

  /** Apertura (ISO 8601). */
  fechaApertura: string;

  /** Asignación al técnico (ISO 8601). */
  fechaAsignacion: string | null;

  /** Inicio de la atención (ISO 8601). */
  fechaInicioAtencion: string | null;

  /** Resolución por el técnico (ISO 8601). */
  fechaResolucionTecnico: string | null;

  /** Cierre (ISO 8601). */
  fechaCierre: string | null;

  /** Si el ticket está fijado. */
  fijado: boolean;

  /** Cliente actual del ticket. */
  clienteActual: TicketConformidadClienteResponseDto | null;

  /** Técnico actual del ticket. */
  tecnicoActual: TicketConformidadPersonaResponseDto | null;

  /** Quién creó el ticket. */
  creadoPor: TicketConformidadPersonaResponseDto | null;
}

export class TicketConformidadFirmaResponseDto {
  /** Id de la firma. */
  id: number;

  /** Quién firmó: cliente o técnico. */
  tipo: TicketFirmaTipo;

  /** Desde dónde se firmó. */
  origen: TicketFirmaOrigen;

  /** Nombre de quien firmó. */
  nombreFirmante: string;

  /** Momento de la firma (ISO 8601). */
  firmadoEn: string;

  /** Usuario que firmó (solo la firma del técnico). */
  usuarioFirmante: TicketConformidadPersonaResponseDto | null;

  /** Imagen de la firma. */
  media: TicketConformidadMediaResponseDto;
}

export class TicketConformidadResumenResponseDto {
  tieneFirmaCliente: boolean;
  tieneFirmaTecnico: boolean;

  /** ISO 8601. */
  firmaClienteEn: string | null;

  /** ISO 8601. */
  firmaTecnicoEn: string | null;

  cantidadFirmas: number;
  requiereRetrabajo: boolean;
  estaConforme: boolean;
  estaPendiente: boolean;

  /** Minutos entre la solicitud y la respuesta; `null` si aún no hay respuesta. */
  tiempoRespuestaMinutos: number | null;
}

export class TicketConformidadDetalleResponseDto {
  /** Id de la conformidad. */
  id: number;

  ticketId: number;
  clienteId: number | null;
  tecnicoAsignadoId: number | null;
  creadoPorId: number | null;

  /** Estado del ciclo de conformidad. */
  resultado: TicketConformidadResultado;

  /** ISO 8601. */
  creadoEn: string;

  /** ISO 8601. */
  actualizadoEn: string;

  /** ISO 8601. */
  respondidoEn: string | null;

  ticket: TicketConformidadTicketResponseDto;

  /** Cliente de este ciclo. */
  cliente: TicketConformidadClienteResponseDto | null;

  /** Técnico asignado al pedir la conformidad. */
  tecnicoAsignado: TicketConformidadPersonaResponseDto | null;

  creadoPor: TicketConformidadPersonaResponseDto | null;
  firmas: TicketConformidadFirmaResponseDto[];
  resumen: TicketConformidadResumenResponseDto;
}

export class TicketConformidadHistorialResumenResponseDto {
  totalSolicitudes: number;
  totalConformes: number;
  totalRetrabajos: number;
  totalPendientes: number;
  totalFirmasCliente: number;
  totalFirmasTecnico: number;
  requirioRetrabajoAlgunaVez: boolean;
  resultadoActual: TicketConformidadResultado | null;

  /** ISO 8601. */
  primeraSolicitudEn: string | null;

  /** ISO 8601. */
  ultimaSolicitudEn: string | null;

  /** ISO 8601. */
  ultimaRespuestaEn: string | null;

  tiempoPromedioRespuestaMinutos: number | null;
}

export class TicketConformidadHistorialResponseDto {
  ticket: TicketConformidadTicketResponseDto;

  /** De la más antigua a la más reciente. */
  conformidades: TicketConformidadDetalleResponseDto[];

  resumen: TicketConformidadHistorialResumenResponseDto;
}

/** Respuesta de abrir un ciclo de conformidad. */
export class TicketConformidadCreadaResponseDto {
  id: number;
  ticketId: number;
  clienteId: number | null;
  tecnicoAsignadoId: number | null;
  creadoPorId: number | null;
  resultado: TicketConformidadResultado;

  /** ISO 8601. */
  creadoEn: string;

  /** ISO 8601. */
  actualizadoEn: string;

  /** ISO 8601. */
  respondidoEn: string | null;
}

export class TicketFirmaTecnicoResponseDto {
  conformidadId: number;
  firmaId: number;
  mediaId: number;
  usuarioFirmanteId: number;
  nombreFirmante: string;

  /** ISO 8601. */
  firmadoEn: string;
}
