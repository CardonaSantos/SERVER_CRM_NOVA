import { DatosDocumentoContrato } from '../read-models/documento-contrato.read-model';

export const DOCUMENTO_CONTRATO_QUERY = Symbol('DOCUMENTO_CONTRATO_QUERY');

export interface DocumentoContratoQueryPort {
  /** `null` si la instalación no existe o su cliente fue eliminado. */
  findDatos(instalacionId: number): Promise<DatosDocumentoContrato | null>;
}
