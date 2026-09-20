import { MikrotikRouterEntity } from '../entities/mikrotik-router-entity';

export interface MikrotikRouterRepositoryPort {
  create(entity: MikrotikRouterEntity): Promise<MikrotikRouterEntity>;

  update(entity: MikrotikRouterEntity): Promise<MikrotikRouterEntity>;

  findById(id: number): Promise<MikrotikRouterEntity | null>;

  findByName(params: {
    empresaId: number;
    nombre: string;
  }): Promise<MikrotikRouterEntity | null>;

  findAll(): Promise<MikrotikRouterEntity[]>;

  deleteById(id: number): Promise<boolean>;
}
