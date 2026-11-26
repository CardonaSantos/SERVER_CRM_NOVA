import { TipoEvidenciaClienteOperacion } from '../enums/tipo-evidencia-cliente-operacion.enum';

export type ClienteInstalacionMediaProps = {
  id?: number;

  instalacionId: number;
  mediaId: number;

  tipo: TipoEvidenciaClienteOperacion;
  descripcion?: string | null;
  orden: number;

  creadoEn?: Date;
};

export type CrearClienteInstalacionMediaProps = {
  instalacionId: number;
  mediaId: number;

  tipo?: TipoEvidenciaClienteOperacion;
  descripcion?: string | null;
  orden?: number | null;
};
