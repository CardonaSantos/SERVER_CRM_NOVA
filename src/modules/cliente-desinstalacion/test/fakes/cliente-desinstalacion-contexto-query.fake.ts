import { ClienteDesinstalacionContextoQueryPort } from '../../domain/ports/cliente-desinstalacion-contexto-query.port';
import { ContextoCreacionDesinstalacion } from '../../domain/read-models/contexto-creacion-desinstalacion.read-model';

export class ClienteDesinstalacionContextoQueryFake
  implements ClienteDesinstalacionContextoQueryPort
{
  contexto: ContextoCreacionDesinstalacion | null = null;
  /** Pares `ticketId:clienteId` que sí pertenecen. */
  tickets = new Set<string>();

  findContextoCreacionByClienteId(): Promise<ContextoCreacionDesinstalacion | null> {
    return Promise.resolve(this.contexto);
  }

  existsTicketForClient(ticketId: number, clienteId: number): Promise<boolean> {
    return Promise.resolve(this.tickets.has(`${ticketId}:${clienteId}`));
  }
}
