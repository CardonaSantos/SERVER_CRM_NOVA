import { Inject, Injectable } from '@nestjs/common';

import { MikrotikRouterRepositoryPort } from '../../domain/ports/mikrotik-router-repository.port';

import { MIKROTIK_ROUTER_REPOSITORY } from '../../infra/tokens/mikrotik-router.tokens';

import {
  MikrotikRouterPublicoReadModel,
  toMikrotikRouterPublico,
} from '../read-models/mikrotik-router-publico.read-model';

@Injectable()
export class ListarMikrotikRoutersUseCase {
  constructor(
    @Inject(MIKROTIK_ROUTER_REPOSITORY)
    private readonly repository: MikrotikRouterRepositoryPort,
  ) {}

  async execute(): Promise<MikrotikRouterPublicoReadModel[]> {
    const routers = await this.repository.findAll();

    return routers.map(toMikrotikRouterPublico);
  }
}
