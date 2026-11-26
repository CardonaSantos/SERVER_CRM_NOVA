import { TicketConformidadResultado } from '../enums/ticket-conformidad-resultado.enum';
import { TicketFirmaOrigen } from '../enums/ticket-firma-origen.enum';
import { TicketFirmaTipo } from '../enums/ticket-firma-tipo.enum';

/**
 * Lecturas de la conformidad para la pantalla del ticket. Solo traen lo que la
 * pantalla usa: sin DPI, observaciones, correos, IP, user-agent ni datos
 * internos del archivo.
 */

export type TicketConformidadPersonaReadModel = {
  id: number;
  nombre: string;
};

export type TicketConformidadClienteReadModel = {
  id: number;
  nombreCompleto: string;
  telefono: string | null;
  direccion: string | null;
};

export type TicketConformidadMediaReadModel = {
  id: number;
  cdnUrl: string | null;
  mimeType: string | null;
};

export type TicketConformidadTicketReadModel = {
  id: number;
  estado: string;
  prioridad: string;
  titulo: string | null;
  descripcion: string | null;
  fechaApertura: Date;
  fechaAsignacion: Date | null;
  fechaInicioAtencion: Date | null;
  fechaResolucionTecnico: Date | null;
  fechaCierre: Date | null;
  fijado: boolean;

  /** Cliente, técnico y creador actuales del ticket (no los del ciclo de conformidad). */
  clienteActual: TicketConformidadClienteReadModel | null;
  tecnicoActual: TicketConformidadPersonaReadModel | null;
  creadoPor: TicketConformidadPersonaReadModel | null;
};

export type TicketConformidadFirmaReadModel = {
  id: number;
  tipo: TicketFirmaTipo;
  origen: TicketFirmaOrigen;
  nombreFirmante: string;
  firmadoEn: Date;
  usuarioFirmante: TicketConformidadPersonaReadModel | null;
  media: TicketConformidadMediaReadModel;
};

export type TicketConformidadDetalleReadModel = {
  id: number;
  ticketId: number;
  clienteId: number | null;
  tecnicoAsignadoId: number | null;
  creadoPorId: number | null;
  resultado: TicketConformidadResultado;
  creadoEn: Date;
  actualizadoEn: Date;
  respondidoEn: Date | null;

  ticket: TicketConformidadTicketReadModel;

  /** Cliente de este ciclo (el que tenía el ticket al pedir la conformidad). */
  cliente: TicketConformidadClienteReadModel | null;

  /** Técnico que estaba asignado al pedir la conformidad. */
  tecnicoAsignado: TicketConformidadPersonaReadModel | null;

  creadoPor: TicketConformidadPersonaReadModel | null;
  firmas: TicketConformidadFirmaReadModel[];

  resumen: {
    tieneFirmaCliente: boolean;
    tieneFirmaTecnico: boolean;
    firmaClienteEn: Date | null;
    firmaTecnicoEn: Date | null;
    cantidadFirmas: number;
    requiereRetrabajo: boolean;
    estaConforme: boolean;
    estaPendiente: boolean;
    tiempoRespuestaMinutos: number | null;
  };
};

export type TicketConformidadHistorialReadModel = {
  ticket: TicketConformidadTicketReadModel;

  /** De la más antigua a la más reciente. */
  conformidades: TicketConformidadDetalleReadModel[];

  resumen: {
    totalSolicitudes: number;
    totalConformes: number;
    totalRetrabajos: number;
    totalPendientes: number;
    totalFirmasCliente: number;
    totalFirmasTecnico: number;
    requirioRetrabajoAlgunaVez: boolean;
    resultadoActual: TicketConformidadResultado | null;
    primeraSolicitudEn: Date | null;
    ultimaSolicitudEn: Date | null;
    ultimaRespuestaEn: Date | null;
    tiempoPromedioRespuestaMinutos: number | null;
  };
};

/** Lo que conformidad necesita saber del ticket de soporte para abrir un ciclo o guardar una firma. */
export type TicketSoporteContextoReadModel = {
  ticketId: number;
  empresaId: number | null;
  clienteId: number | null;
  tecnicoId: number | null;
};
