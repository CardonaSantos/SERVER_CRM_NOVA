import { EstadoCliente, EstadoCobranzaCliente } from '@prisma/client';

export interface ClienteReporteRow {
  // Identidad
  id: number;
  nombre: string;
  apellidos: string | null;
  nombreCompleto: string;

  // Identificación
  dpi: string | null;

  // Contacto
  telefono: string | null;
  contactoReferenciaNombre: string | null;
  contactoReferenciaTelefono: string | null;

  // Estado
  estadoCliente: EstadoCliente;
  estadoCobranza: EstadoCobranzaCliente;

  // Servicio
  plan: string | null;
  fechaInstalacion: Date | null;

  // Ubicación
  sector: string | null;
  municipio: string | null;
  departamento: string | null;
  direccion: string | null;

  latitud: number | null;
  longitud: number | null;
  ubicacionMapsUrl: string | null;

  // Información administrativa
  observaciones: string | null;
  nota: string | null;

  // Indicadores
  totalTickets: number;
  totalInstalaciones: number;
  totalDesinstalaciones: number;

  // Estado del registro
  isEliminado: boolean;
  desinstaladoEn: Date | null;

  // Auditoría
  creadoEn: Date;
  actualizadoEn: Date;
}
