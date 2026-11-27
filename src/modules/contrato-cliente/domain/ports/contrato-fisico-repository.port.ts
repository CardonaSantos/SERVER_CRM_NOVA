import { ContratoFisicoProps } from '../props/contrato-fisico.props';

export const CONTRATO_FISICO_REPOSITORY = Symbol('CONTRATO_FISICO_REPOSITORY');

export interface ContratoFisicoRepositoryPort {
  /**
   * Crea o actualiza el contrato en papel del cliente; lo que no llega no se
   * toca.
   * @throws ContratoNumeroDuplicadoError si el número ya es de otro cliente.
   */
  guardar(contrato: ContratoFisicoProps): Promise<void>;
}
