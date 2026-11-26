import { RolTecnicoOperacionCliente } from 'src/modules/cliente-instalacion/public/cliente-instalacion.types';

export type ClienteDesinstalacionTecnicoProps = {
  id?: number;

  desinstalacionId: number;
  tecnicoId?: number | null;

  rol: RolTecnicoOperacionCliente;
  esResponsable: boolean;

  tiempoMinutos?: number | null;
  observaciones?: string | null;
  tecnicoNombreSnapshot?: string | null;

  creadoEn?: Date;
  actualizadoEn?: Date;
};

export type CrearClienteDesinstalacionTecnicoProps = {
  desinstalacionId: number;
  tecnicoId?: number | null;

  rol?: RolTecnicoOperacionCliente;
  esResponsable?: boolean;

  tiempoMinutos?: number | null;
  observaciones?: string | null;
  tecnicoNombreSnapshot?: string | null;
};
