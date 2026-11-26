import { TipoEvidenciaClienteOperacion } from 'src/modules/cliente-instalacion/public/cliente-instalacion.types';

export type ClienteDesinstalacionMediaProps = {
  id: number | null;

  desinstalacionId: number;

  mediaId: number;

  tipo: TipoEvidenciaClienteOperacion;

  descripcion: string | null;

  orden: number;

  creadoEn: Date;
};

export type CrearClienteDesinstalacionMediaProps = {
  desinstalacionId: number;

  mediaId: number;

  tipo: TipoEvidenciaClienteOperacion;

  descripcion?: string | null;

  orden?: number | null;
};
