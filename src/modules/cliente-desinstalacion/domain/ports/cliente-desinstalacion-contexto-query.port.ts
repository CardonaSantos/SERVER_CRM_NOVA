import { ContextoCreacionDesinstalacion } from '../read-models/contexto-creacion-desinstalacion.read-model';

export interface ClienteDesinstalacionContextoQueryPort {
  findContextoCreacionByClienteId(
    clienteId: number,
  ): Promise<ContextoCreacionDesinstalacion | null>;

  existsTicketForClient(ticketId: number, clienteId: number): Promise<boolean>;
}

export const CLIENTE_DESINSTALACION_CONTEXTO_QUERY = Symbol(
  'CLIENTE_DESINSTALACION_CONTEXTO_QUERY',
);
