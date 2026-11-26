import { EstadoAutorizacionDesinstalacion } from '../enums/estado-autorizacion-desinstalacion.enum';

export type ClienteDesinstalacionAutorizacionProps = {
  id?: number;

  desinstalacionId: number;

  solicitadoPorId?: number | null;
  autorizadoPorId?: number | null;

  estado: EstadoAutorizacionDesinstalacion;

  motivoSolicitud?: string | null;
  comentarioAutorizador?: string | null;

  fechaSolicitud?: Date;
  fechaRespuesta?: Date | null;
};

export type CrearClienteDesinstalacionAutorizacionProps = {
  desinstalacionId: number;
  solicitadoPorId?: number | null;
  motivoSolicitud?: string | null;
};
