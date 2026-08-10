import {
  EstadoAccesoInternet,
  EstadoCuentaPppoe,
  EstadoTicketSoporte,
  MetodoAutenticacionInternet,
  PrioridadTicketSoporte,
  TecnologiaAccesoInternet,
} from '@prisma/client';

export type ContextoDesinstalacionClienteResumen = {
  id: number;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
  dpi: string | null;
  direccion: string | null;
};

export type ContextoDesinstalacionServicioResumen = {
  id: number;
  nombre: string;
  velocidad: string | null;
  precio: number;
};

export type ContextoDesinstalacionCuentaPppoeResumen = {
  id: number;
  usuario: string;
  estado: EstadoCuentaPppoe;
  perfilHomologacionId: number;
};

export type ContextoDesinstalacionAccesoResumen = {
  id: number;
  servicioInternetId: number | null;

  tecnologia: TecnologiaAccesoInternet;
  metodoAutenticacion: MetodoAutenticacionInternet;
  estado: EstadoAccesoInternet;

  activadoEn: Date | null;
  suspendidoEn: Date | null;
  dadoDeBajaEn: Date | null;

  servicioInternet: ContextoDesinstalacionServicioResumen | null;

  cuentaPppoe: ContextoDesinstalacionCuentaPppoeResumen | null;
};

export type ContextoDesinstalacionTicketResumen = {
  id: number;

  titulo: string | null;
  descripcion: string | null;

  estado: EstadoTicketSoporte;
  prioridad: PrioridadTicketSoporte;

  fechaApertura: Date;
  fechaCierre: Date | null;
};

export type ContextoCreacionDesinstalacion = {
  cliente: ContextoDesinstalacionClienteResumen;

  accesos: ContextoDesinstalacionAccesoResumen[];

  tickets: ContextoDesinstalacionTicketResumen[];
};
