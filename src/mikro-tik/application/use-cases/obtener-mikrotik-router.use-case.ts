import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MikrotikRouterRepositoryPort } from '../../domain/ports/mikrotik-router-repository.port';

import { MIKROTIK_ROUTER_REPOSITORY } from '../../infra/tokens/mikrotik-router.tokens';

import {
  MikrotikRouterPublicoReadModel,
  toMikrotikRouterPublico,
} from '../read-models/mikrotik-router-publico.read-model';

@Injectable()
export class ObtenerMikrotikRouterUseCase {
  constructor(
    @Inject(MIKROTIK_ROUTER_REPOSITORY)
    private readonly repository: MikrotikRouterRepositoryPort,
  ) {}

  async execute(id: number): Promise<MikrotikRouterPublicoReadModel> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('id debe ser un entero positivo.');
    }

    const router = await this.repository.findById(id);

    if (!router) {
      throw new NotFoundException(`No existe el router MikroTik ${id}.`);
    }

    return toMikrotikRouterPublico(router);
  }
}
