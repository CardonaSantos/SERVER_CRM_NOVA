import { ClienteExpediente } from '../entities/credito-cliente-expediente.entity';

export interface CreditoClienteExpedienteRepository {
  saveExpediente(expediente: ClienteExpediente): Promise<ClienteExpediente>;

  getExpedienteByIdCredito(id: number): Promise<ClienteExpediente | null>;

  //   getExpedienteByIdCredito(id: number): Promise<ClienteExpediente | null>;
}
