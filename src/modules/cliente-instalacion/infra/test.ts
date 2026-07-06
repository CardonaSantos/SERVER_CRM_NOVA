import { Injectable } from '@nestjs/common';
import { ClienteInstalacionEntity } from '../domain/entities/cliente-instalacion.entity';
import {
  ClienteInstalacionFindManyFilters,
  ClienteInstalacionPaginatedResult,
  ClienteInstalacionRepositoryPort,
} from '../domain/ports/cliente-instalacion.repository.port';

@Injectable()
export class InMemoryClienteInstalacionRepository
  implements ClienteInstalacionRepositoryPort
{
  private readonly items = new Map<number, ClienteInstalacionEntity>();
  private idSequence = 1;

  async create(
    entity: ClienteInstalacionEntity,
  ): Promise<ClienteInstalacionEntity> {
    const props = entity.toPrimitives();

    const created = ClienteInstalacionEntity.hydrate({
      ...props,
      id: this.idSequence++,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    });

    this.items.set(created.id!, created);

    return created;
  }

  async findById(params: {
    id: number;
    empresaId: number;
  }): Promise<ClienteInstalacionEntity | null> {
    const entity = this.items.get(params.id);

    if (!entity) return null;

    if (entity.empresaId !== params.empresaId) return null;

    return entity;
  }

  async findMany(
    filters: ClienteInstalacionFindManyFilters,
  ): Promise<ClienteInstalacionPaginatedResult> {
    const all = Array.from(this.items.values()).filter(
      (item) => item.empresaId === filters.empresaId,
    );

    const start = (filters.page - 1) * filters.limit;
    const end = start + filters.limit;

    return {
      items: all.slice(start, end),
      total: all.length,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async save(
    entity: ClienteInstalacionEntity,
  ): Promise<ClienteInstalacionEntity> {
    const props = entity.toPrimitives();

    if (!props.id) {
      throw new Error('No se puede guardar una instalación sin id.');
    }

    const updated = ClienteInstalacionEntity.hydrate({
      ...props,
      actualizadoEn: new Date(),
    });

    this.items.set(props.id, updated);

    return updated;
  }
}
