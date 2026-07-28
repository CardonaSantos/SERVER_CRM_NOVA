import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MikrotikRouterRepositoryPort } from '../../domain/ports/mikrotik-router-repository.port';

import { MIKROTIK_ROUTER_REPOSITORY } from '../../infra/tokens/mikrotik-router.tokens';

export type EliminarMikrotikRouterResult = {
  id: number;

  eliminado: true;
};

@Injectable()
export class EliminarMikrotikRouterUseCase {
  constructor(
    @Inject(MIKROTIK_ROUTER_REPOSITORY)
    private readonly repository: MikrotikRouterRepositoryPort,
  ) {}

  async execute(id: number): Promise<EliminarMikrotikRouterResult> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('id debe ser un entero positivo.');
    }

    const deleted = await this.repository.deleteById(id);

    if (!deleted) {
      throw new NotFoundException(`No existe el router MikroTik ${id}.`);
    }

    return {
      id,

      eliminado: true,
    };
  }
}
