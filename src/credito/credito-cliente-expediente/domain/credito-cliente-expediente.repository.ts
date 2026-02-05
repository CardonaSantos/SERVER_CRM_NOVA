import { Prisma } from '@prisma/client';
import { ClienteArchivo } from '../entities/cliente-archivo.entity';
import { ClienteReferencia } from '../entities/cliente-referencia.entity';
import { ClienteExpediente } from '../entities/credito-cliente-expediente.entity';

export const CLIENTE_EXPEDIENTE_REPOSITORY = Symbol(
  'CLIENTE_EXPEDIENTE_REPOSITORY',
);

export interface CreditoClienteExpedienteRepository {
  saveExpediente(
    expediente: ClienteExpediente,
    tx?: Prisma.TransactionClient,
  ): Promise<ClienteExpediente>;

  saveMedia(
    clienteArchivo: ClienteArchivo,
    tx?: Prisma.TransactionClient,
  ): Promise<ClienteArchivo>;

  saveReferencia(
    referencia: ClienteReferencia,
    tx?: Prisma.TransactionClient,
  ): Promise<ClienteReferencia>;

  getAllMedia(): Promise<ClienteArchivo[]>;

  deleteExpediente(expedienteId: number): Promise<void>;
}
