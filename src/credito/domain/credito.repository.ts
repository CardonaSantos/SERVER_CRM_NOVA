import { GetCreditosQueryDto } from '../dto/get-creditos-query.dto';
import { Credito } from '../entities/credito.entity';

export const CREDITO = Symbol('CREDITO');

export interface CreditoRepository {
  save(credito: Credito): Promise<Credito>;

  findById(id: number): Promise<Credito | null>;

  findByCliente(clienteId: number): Promise<Credito[]>;

  existsActiveByCliente(clienteId: number): Promise<boolean>;

  findAll(query: GetCreditosQueryDto): Promise<{
    data: Credito[];
    meta: { total: number; page: number; lastPage: number };
  }>;

  deleteAll(): Promise<number>;
}
