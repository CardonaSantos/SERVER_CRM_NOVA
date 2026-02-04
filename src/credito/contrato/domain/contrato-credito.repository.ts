import { Contrato } from '../entities/contrato.entity';

export const CONTRATO_CREDITO_REPOSITORY = Symbol(
  'CONTRATO_CREDITO_REPOSITORY',
);

export interface ContratoCreditoRepository {
  create(contrato: Contrato): Promise<Contrato>;

  findById(id: number): Promise<Contrato>;

  deleteById(id: number): Promise<void>;

  deleteAll(): Promise<number>;

  findMany(): Promise<Array<Contrato>>;
}
