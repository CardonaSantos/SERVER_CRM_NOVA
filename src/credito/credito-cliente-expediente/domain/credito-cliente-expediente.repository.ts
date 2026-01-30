import { ClienteArchivo } from '../entities/cliente-archivo.entity';
import { ClienteExpediente } from '../entities/credito-cliente-expediente.entity';

export const CLIENTE_EXPEDIENTE_REPOSITORY = Symbol(
  'CLIENTE_EXPEDIENTE_REPOSITORY',
);

export interface CreditoClienteExpedienteRepository {
  findByClienteId(clienteId: number): Promise<ClienteExpediente | null>;

  save(expediente: ClienteExpediente): Promise<ClienteExpediente>;

  saveMedia(clienteArchivo: ClienteArchivo): Promise<ClienteArchivo>;

  getAllMedia(): Promise<Array<ClienteArchivo>>;
}
