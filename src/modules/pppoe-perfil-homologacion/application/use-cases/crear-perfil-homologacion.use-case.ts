import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { PerfilHomologacionEntity } from '../../domain/entities/perfil-homologacion.entity';
import {
  PerfilHomologacionCodigoDuplicadoError,
  PerfilHomologacionDuplicadoError,
} from '../../domain/errors/pppoe-perfil-homologacion.errors';
import {
  PERFIL_HOMOLOGACION_REPOSITORY,
  PerfilHomologacionRepositoryPort,
} from '../../domain/ports/perfil-homologacion-repository.port';
import {
  PerfilHomologacionReadModel,
  aPerfilHomologacionReadModel,
} from '../../domain/read-models/perfil-homologacion.read-model';

export type CrearPerfilHomologacionInput = {
  empresaId: number;
  creadoPorId: number;
  mikrotikRouterId: number;
  servicioInternetId: number;
  codigoPerfil: string;
};

/** Un router + servicio tiene una sola homologación y un código no se repite en el router. */
@Injectable()
export class CrearPerfilHomologacionUseCase {
  constructor(
    @Inject(PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfiles: PerfilHomologacionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CrearPerfilHomologacionInput,
  ): Promise<PerfilHomologacionReadModel> {
    const existente = await this.perfiles.findByRouterAndService({
      mikrotikRouterId: input.mikrotikRouterId,
      servicioInternetId: input.servicioInternetId,
    });
    if (existente) throw new PerfilHomologacionDuplicadoError();

    const perfil = PerfilHomologacionEntity.create(
      {
        empresaId: input.empresaId,
        mikrotikRouterId: input.mikrotikRouterId,
        servicioInternetId: input.servicioInternetId,
        codigoPerfil: input.codigoPerfil,
        creadoPorId: input.creadoPorId,
      },
      this.reloj.ahora(),
    );

    const mismoCodigo = await this.perfiles.findByRouterAndCode({
      mikrotikRouterId: perfil.mikrotikRouterId,
      codigoPerfil: perfil.codigoPerfil,
    });
    if (mismoCodigo) throw new PerfilHomologacionCodigoDuplicadoError();

    return aPerfilHomologacionReadModel(await this.perfiles.create(perfil));
  }
}
