import { PppoeAuditoriaEntity } from '../../domain/entities/pppoe-auditoria.entity';
import { PppoeAuditoriaRepositoryPort } from '../../domain/ports/pppoe-auditoria-repository.port';
import { PppoeAuditoriaPaginatedResult } from '../../domain/read-models/pppoe-auditoria-list.read-model';

/** Bitácora en memoria para pruebas. */
export class PppoeAuditoriaRepositoryFake
  implements PppoeAuditoriaRepositoryPort
{
  readonly eventos: PppoeAuditoriaEntity[] = [];

  async create(entity: PppoeAuditoriaEntity): Promise<PppoeAuditoriaEntity> {
    this.eventos.push(entity);
    return entity;
  }

  async findPaginated(): Promise<PppoeAuditoriaPaginatedResult> {
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  }
}
