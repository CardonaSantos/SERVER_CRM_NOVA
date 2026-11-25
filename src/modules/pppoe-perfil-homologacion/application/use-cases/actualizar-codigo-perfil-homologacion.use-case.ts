import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import {
  PerfilHomologacionCodigoDuplicadoError,
  PerfilHomologacionNoEncontradoError,
} from '../../domain/errors/pppoe-perfil-homologacion.errors';
import {
  PERFIL_HOMOLOGACION_REPOSITORY,
  PerfilHomologacionRepositoryPort,
} from '../../domain/ports/perfil-homologacion-repository.port';
import {
  PerfilHomologacionReadModel,
  aPerfilHomologacionReadModel,
} from '../../domain/read-models/perfil-homologacion.read-model';

export type ActualizarCodigoPerfilHomologacionInput = {
  id: number;
  codigoPerfil: string;
  actualizadoPorId: number;
};

/** Cambia solo el código del profile de MikroTik; router y servicio no cambian. */
@Injectable()
export class ActualizarCodigoPerfilHomologacionUseCase {
  constructor(
    @Inject(PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfiles: PerfilHomologacionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: ActualizarCodigoPerfilHomologacionInput,
  ): Promise<PerfilHomologacionReadModel> {
    const perfil = await this.perfiles.findById(input.id);
    if (!perfil) throw new PerfilHomologacionNoEncontradoError();

    const codigoPerfil = input.codigoPerfil.trim();

    // Sin cambio no se escribe, para no mover actualizadoEn.
    if (codigoPerfil === perfil.codigoPerfil) {
      return aPerfilHomologacionReadModel(perfil);
    }

    const mismoCodigo = await this.perfiles.findByRouterAndCode({
      mikrotikRouterId: perfil.mikrotikRouterId,
      codigoPerfil,
    });
    if (mismoCodigo && mismoCodigo.id !== perfil.id) {
      throw new PerfilHomologacionCodigoDuplicadoError();
    }

    perfil.actualizarCodigoPerfil(
      codigoPerfil,
      input.actualizadoPorId,
      this.reloj.ahora(),
    );

    return aPerfilHomologacionReadModel(await this.perfiles.update(perfil));
  }
}
