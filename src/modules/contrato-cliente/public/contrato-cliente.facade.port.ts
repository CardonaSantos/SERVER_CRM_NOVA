import { ContratoFisicoProps } from '../domain/props/contrato-fisico.props';

export const CONTRATO_CLIENTE = Symbol('CONTRATO_CLIENTE');

export type GuardarContratoFisicoInput = ContratoFisicoProps;

export interface ContratoClienteFacadePort {
  /**
   * Crea o actualiza el contrato en papel del cliente. Se une a la unidad de
   * trabajo abierta.
   * @throws `CLIENTE_CONTRATO_DUPLICADO` si el número ya es de otro cliente.
   */
  guardarContratoFisico(input: GuardarContratoFisicoInput): Promise<void>;
}
