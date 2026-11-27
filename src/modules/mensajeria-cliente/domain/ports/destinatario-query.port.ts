import { ClienteDestinatario } from '../policies/destinatarios.policy';

export const DESTINATARIO_QUERY = Symbol('DESTINATARIO_QUERY');

export interface DestinatarioQueryPort {
  /** Incluye los eliminados (para informar por qué se omiten). */
  findByIds(clienteIds: number[]): Promise<ClienteDestinatario[]>;
}
