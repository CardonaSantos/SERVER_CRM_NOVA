import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MikrotikRouterRepositoryPort } from '../../domain/ports/mikrotik-router-repository.port';

import { MIKROTIK_ROUTER_REPOSITORY } from '../../infra/tokens/mikrotik-router.tokens';

export type ReactivarMikrotikRouterResult = {
  id: number;
  activo: true;
  nombre: string;
};

@Injectable()
export class ReactivarMikrotikRouterUseCase {
  private static readonly ARCHIVED_SUFFIX = /\s+\[DESACTIVADO-\d+\]$/u;

  constructor(
    @Inject(MIKROTIK_ROUTER_REPOSITORY)
    private readonly repository: MikrotikRouterRepositoryPort,
  ) {}

  async execute(id: number): Promise<ReactivarMikrotikRouterResult> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('id debe ser un entero positivo.');
    }

    const router = await this.repository.findById(id);

    if (!router) {
      throw new NotFoundException(`No existe el router MikroTik ${id}.`);
    }

    /*
     * Idempotente.
     */
    if (router.activo) {
      return {
        id,
        activo: true,
        nombre: router.nombre,
      };
    }

    const nombreRestaurado = this.restoreOriginalName(router.nombre);

    const duplicated = await this.repository.findByName({
      empresaId: router.empresaId,
      nombre: nombreRestaurado,
    });

    if (duplicated && duplicated.id !== router.id) {
      throw new ConflictException(
        `No puede reactivarse el router porque ya existe otro MikroTik activo o registrado con el nombre "${nombreRestaurado}".`,
      );
    }

    router.reactivar(nombreRestaurado);

    const updated = await this.repository.update(router);

    return {
      id,
      activo: true,
      nombre: updated.nombre,
    };
  }

  private restoreOriginalName(archivedName: string): string {
    const restored = archivedName
      .replace(ReactivarMikrotikRouterUseCase.ARCHIVED_SUFFIX, '')
      .trim();

    if (!restored) {
      throw new ConflictException(
        'No fue posible determinar el nombre original del router MikroTik.',
      );
    }

    return restored;
  }
}
