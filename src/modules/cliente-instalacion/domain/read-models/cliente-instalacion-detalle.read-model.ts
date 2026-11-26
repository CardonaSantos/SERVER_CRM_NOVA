import { RolTecnicoOperacionCliente } from '../enums/rol-tecnico-operacion-cliente.enum';
import { TipoEvidenciaClienteOperacion } from '../enums/tipo-evidencia-cliente-operacion.enum';
import {
  ClienteInstalacionUsuarioResumen,
  ClienteInstalacionClienteResumen,
  ClienteInstalacionServicioResumen,
} from './cliente-instalacion-listado.read-model';
import { ClienteInstalacionResumen } from './cliente-instalacion-resumen.read-model';

export type ClienteInstalacionTecnicoDetalle = {
  id: number;
  instalacionId: number;

  tecnicoId?: number | null;

  rol: RolTecnicoOperacionCliente;

  esResponsable: boolean;

  tiempoMinutos?: number | null;

  observaciones?: string | null;

  tecnicoNombreSnapshot?: string | null;

  creadoEn: Date;
  actualizadoEn: Date;

  tecnico: ClienteInstalacionUsuarioResumen | null;
};

export type ClienteInstalacionEvidenciaDetalle = {
  id: number;

  instalacionId: number;

  mediaId: number;

  tipo: TipoEvidenciaClienteOperacion;

  descripcion?: string | null;

  orden: number;

  creadoEn: Date;

  media: {
    id: number;

    cdnUrl?: string | null;

    key: string;

    mimeType?: string | null;

    extension?: string | null;

    tamanioBytes?: bigint | number | string | null;

    subidoPor: ClienteInstalacionUsuarioResumen | null;
  };
};

export type ClienteInstalacionDetalle = {
  instalacion: ClienteInstalacionResumen;

  cliente: ClienteInstalacionClienteResumen;

  servicioInternet: ClienteInstalacionServicioResumen | null;

  ticket: ClienteInstalacionTicketResumen | null;

  participantes: {
    asesor: ClienteInstalacionUsuarioResumen | null;
    creadoPor: ClienteInstalacionUsuarioResumen | null;
    completadoPor: ClienteInstalacionUsuarioResumen | null;
  };

  tecnicos: ClienteInstalacionTecnicoDetalle[];
  evidencias: ClienteInstalacionEvidenciaDetalle[];

  conteos: {
    tecnicos: number;
    evidencias: number;
    equipos: number;
  };
  cuentaPppoe: {
    id: number;
  } | null;
};

export type ClienteInstalacionTicketResumen = {
  id: number;

  titulo: string | null;

  estado: string;
  prioridad: string;

  fechaApertura: Date;
  fechaCierre: Date | null;
};

// DETALLE INSTALACION TECNICO
