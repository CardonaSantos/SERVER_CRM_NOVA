export const CONTRATO_FISICO = Symbol('CONTRATO_FISICO');

export type GuardarContratoFisico = {
  clienteId: number;
  idContrato: string;
  fechaFirma?: Date;
  archivoContrato?: string;
  observaciones?: string;
};

/**
 * El contrato firmado del cliente. Transitorio: pasará a la fachada de
 * `contrato-cliente`.
 */
export interface ContratoFisicoPort {
  /**
   * Crea o actualiza el contrato del cliente.
   * @throws ClienteContratoDuplicadoError si el número ya es de otro cliente.
   */
  guardar(contrato: GuardarContratoFisico): Promise<void>;
}
