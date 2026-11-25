import { Inject, Injectable } from '@nestjs/common';

import { PerfilHomologacionEntity } from '../../domain/entities/perfil-homologacion.entity';
import {
  PERFIL_HOMOLOGACION_REPOSITORY,
  PerfilHomologacionRepositoryPort,
} from '../../domain/ports/perfil-homologacion-repository.port';
import {
  PerfilHomologacionReadModel,
  aPerfilHomologacionReadModel,
} from '../../domain/read-models/perfil-homologacion.read-model';

export type BuscarPerfilHomologacionInput =
  | { por: 'ID'; id: number }
  | {
      por: 'ACTIVO_ROUTER_SERVICIO';
      mikrotikRouterId: number;
      servicioInternetId: number;
    };

/** Búsqueda sin error: devuelve null si no hay. La usa la fachada. */
@Injectable()
export class BuscarPerfilHomologacionUseCase {
  constructor(
    @Inject(PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfiles: PerfilHomologacionRepositoryPort,
  ) {}

  async execute(
    input: BuscarPerfilHomologacionInput,
  ): Promise<PerfilHomologacionReadModel | null> {
    const perfil = await this.buscar(input);
    return perfil ? aPerfilHomologacionReadModel(perfil) : null;
  }

  private buscar(
    input: BuscarPerfilHomologacionInput,
  ): Promise<PerfilHomologacionEntity | null> {
    switch (input.por) {
      case 'ID':
        return this.perfiles.findById(input.id);
      case 'ACTIVO_ROUTER_SERVICIO':
        return this.perfiles.findActiveByRouterAndService({
          mikrotikRouterId: input.mikrotikRouterId,
          servicioInternetId: input.servicioInternetId,
        });
      default: {
        const exhaustivo: never = input;
        throw new Error(`Búsqueda no soportada: ${JSON.stringify(exhaustivo)}`);
      }
    }
  }
}
