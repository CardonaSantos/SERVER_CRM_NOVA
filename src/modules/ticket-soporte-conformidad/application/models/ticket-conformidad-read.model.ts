import { TicketConformidadCanal } from '../../domain/enums/ticket-conformidad-canal.enum';
import { TicketConformidadResultado } from '../../domain/enums/ticket-conformidad-resultado.enum';
import { TicketFirmaOrigen } from '../../domain/enums/ticket-firma-origen.enum';
import { TicketFirmaTipo } from '../../domain/enums/ticket-firma-tipo.enum';

/* =========================================================
 * USUARIO
 * ======================================================= */

export interface TicketConformidadUsuarioReadModel {
  id: number;

  empresaId: number;

  nombre: string;
  correo: string;
  telefono: string | null;

  rol: string;

  activo: boolean;
}

/* =========================================================
 * CLIENTE
 * ======================================================= */

export interface TicketConformidadClienteReadModel {
  id: number;

  empresaId: number | null;
  asesorId: number | null;

  nombre: string;
  apellidos: string | null;
  nombreCompleto: string;

  dpi: string | null;

  observaciones: string | null;
  nota: string | null;

  telefono: string | null;
  direccion: string | null;

  contactoReferenciaNombre: string | null;
  contactoReferenciaTelefono: string | null;

  ssidRouter: string | null;

  fechaInstalacion: Date | null;

  servicioInternetId: number | null;
  sectorId: number | null;

  municipioId: number | null;
  departamentoId: number | null;
  facturacionZonaId: number | null;

  mikrotikRouterId: number | null;

  estadoCliente: string;
  estadoCobranza: string;
  estadoServicioMikrotik: string;

  enviarRecordatorio: boolean;

  isEliminado: boolean;
  eliminadoEn: Date | null;
  desinstaladoEn: Date | null;

  whatsappActivo: boolean;
  whatsappDesactivadoEn: Date | null;
  whatsappDesactivadoPorId: number | null;
  motivoWhatsappDesactivado: string | null;

  creadoEn: Date;
  actualizadoEn: Date;

  asesor: TicketConformidadUsuarioReadModel | null;
}

/* =========================================================
 * MEDIA
 * ======================================================= */

export interface TicketConformidadMediaReadModel {
  id: number;

  empresaId: number;
  clienteId: number | null;
  albumId: number | null;
  subidoPorId: number | null;

  categoria: string;
  tipo: string;
  estado: string;

  bucket: string | null;
  region: string | null;

  key: string;
  cdnUrl: string | null;

  mimeType: string | null;
  extension: string | null;

  /**
   * Prisma entrega BigInt.
   * Se transforma a string para que sea serializable por JSON.
   */
  tamanioBytes: string | null;

  ancho: number | null;
  alto: number | null;

  checksumSha256: string | null;

  titulo: string | null;
  descripcion: string | null;
  etiqueta: string | null;

  orden: number;

  tomadoEn: Date | null;

  publico: boolean;
  eliminadoEn: Date | null;

  metadatos: unknown | null;

  notas: string | null;

  creadoEn: Date;
  actualizadoEn: Date;

  subidoPor: TicketConformidadUsuarioReadModel | null;
}

/* =========================================================
 * TICKET
 * ======================================================= */

export interface TicketConformidadTicketReadModel {
  id: number;

  clienteId: number | null;
  empresaId: number | null;
  tecnicoId: number | null;
  creadoPorId: number | null;

  estado: string;
  prioridad: string;

  titulo: string | null;
  descripcion: string | null;

  fechaApertura: Date;
  fechaAsignacion: Date | null;
  fechaInicioAtencion: Date | null;
  fechaResolucionTecnico: Date | null;
  fechaCierre: Date | null;

  creadoEn: Date | null;
  actualizadoEn: Date;

  fijado: boolean;

  /**
   * Relaciones actuales del TicketSoporte.
   *
   * No deben confundirse con los snapshots guardados
   * en TicketConformidad.
   */
  clienteActual: TicketConformidadClienteReadModel | null;

  tecnicoActual: TicketConformidadUsuarioReadModel | null;

  creadoPor: TicketConformidadUsuarioReadModel | null;
}

/* =========================================================
 * FIRMA
 * ======================================================= */

export interface TicketConformidadFirmaReadModel {
  id: number;

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

  usuarioFirmante: TicketConformidadUsuarioReadModel | null;

  media: TicketConformidadMediaReadModel;
}

/* =========================================================
 * ENLACE
 * ======================================================= */

export type TicketConformidadEnlaceEstadoReadModel =
  | 'ACTIVO'
  | 'USADO'
  | 'EXPIRADO'
  | 'REVOCADO';

export interface TicketConformidadEnlaceReadModel {
  id: number;

  conformidadId: number;

  canal: TicketConformidadCanal;

  telefonoDestino: string | null;

  expiraEn: Date;

  usadoEn: Date | null;
  revocadoEn: Date | null;

  creadoPorId: number | null;

  creadoEn: Date;

  creadoPor: TicketConformidadUsuarioReadModel | null;

  estadoDerivado: TicketConformidadEnlaceEstadoReadModel;
}

/* =========================================================
 * DETALLE
 * ======================================================= */

export interface TicketConformidadDetalleReadModel {
  id: number;

  ticketId: number;

  clienteId: number | null;
  tecnicoAsignadoId: number | null;
  creadoPorId: number | null;

  resultado: TicketConformidadResultado;

  creadoEn: Date;
  actualizadoEn: Date;
  respondidoEn: Date | null;

  /**
   * Ticket actual.
   */
  ticket: TicketConformidadTicketReadModel;

  /**
   * Cliente relacionado con este ciclo de conformidad.
   */
  cliente: TicketConformidadClienteReadModel | null;

  /**
   * Técnico que estaba asignado cuando se creó
   * este ciclo de conformidad.
   */
  tecnicoAsignado: TicketConformidadUsuarioReadModel | null;

  creadoPor: TicketConformidadUsuarioReadModel | null;

  firmas: TicketConformidadFirmaReadModel[];

  enlaces: TicketConformidadEnlaceReadModel[];

  resumen: {
    tieneFirmaCliente: boolean;
    tieneFirmaTecnico: boolean;

    firmaClienteEn: Date | null;
    firmaTecnicoEn: Date | null;

    cantidadFirmas: number;

    cantidadEnlaces: number;
    cantidadEnlacesUsados: number;
    cantidadEnlacesExpirados: number;
    cantidadEnlacesRevocados: number;
    cantidadEnlacesActivos: number;

    ultimoEnlaceCanal: TicketConformidadCanal | null;
    ultimoEnlaceCreadoEn: Date | null;

    requiereRetrabajo: boolean;
    estaConforme: boolean;
    estaPendiente: boolean;

    tiempoRespuestaMinutos: number | null;
  };
}

/* =========================================================
 * HISTORIAL COMPLETO DEL TICKET
 * ======================================================= */

export interface TicketConformidadHistorialReadModel {
  ticket: TicketConformidadTicketReadModel;

  conformidades: TicketConformidadDetalleReadModel[];

  resumen: {
    totalSolicitudes: number;

    totalConformes: number;
    totalRetrabajos: number;
    totalPendientes: number;

    totalFirmasCliente: number;
    totalFirmasTecnico: number;

    totalEnlaces: number;
    totalEnlacesUsados: number;
    totalEnlacesActivos: number;

    requirioRetrabajoAlgunaVez: boolean;

    resultadoActual: TicketConformidadResultado | null;

    primeraSolicitudEn: Date | null;
    ultimaSolicitudEn: Date | null;
    ultimaRespuestaEn: Date | null;

    tiempoPromedioRespuestaMinutos: number | null;
  };
}
