import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MikrotikRouterRepositoryPort } from '../../domain/ports/mikrotik-router-repository.port';

import { MIKROTIK_ROUTER_REPOSITORY } from '../../infra/tokens/mikrotik-router.tokens';

export type RetirarMikrotikRouterResult = {
  id: number;
  activo: false;
  nombre: string;
};

@Injectable()
export class RetirarMikrotikRouterUseCase {
  private static readonly MAX_NAME_LENGTH = 160;

  constructor(
    @Inject(MIKROTIK_ROUTER_REPOSITORY)
    private readonly repository: MikrotikRouterRepositoryPort,
  ) {}

  async execute(id: number): Promise<RetirarMikrotikRouterResult> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('id debe ser un entero positivo.');
    }

    const router = await this.repository.findById(id);

    if (!router) {
      throw new NotFoundException(`No existe el router MikroTik ${id}.`);
    }

    /*
     * Ya retirado.
     * No volvemos a cambiarle el correlativo.
     */
    if (!router.activo) {
      return {
        id,
        activo: false,
        nombre: router.nombre,
      };
    }

    const nombreArchivado = await this.buildArchivedName({
      empresaId: router.empresaId,
      nombreActual: router.nombre,
    });

    router.retirar(nombreArchivado);

    const updated = await this.repository.update(router);

    return {
      id,
      activo: false,
      nombre: updated.nombre,
    };
  }

  private async buildArchivedName(params: {
    empresaId: number;
    nombreActual: string;
  }): Promise<string> {
    for (let correlativo = 1; correlativo <= 9999; correlativo += 1) {
      const number = String(correlativo).padStart(2, '0');

      const suffix = ` [DESACTIVADO-${number}]`;

      const maxBaseLength =
        RetirarMikrotikRouterUseCase.MAX_NAME_LENGTH - suffix.length;

      const baseName = params.nombreActual
        .trim()
        .slice(0, maxBaseLength)
        .trimEnd();

      const candidate = `${baseName}${suffix}`;

      const existing = await this.repository.findByName({
        empresaId: params.empresaId,
        nombre: candidate,
      });

      if (!existing) {
        return candidate;
      }
    }

    throw new Error(
      'No fue posible generar un nombre histórico para el router MikroTik.',
    );
  }
}
