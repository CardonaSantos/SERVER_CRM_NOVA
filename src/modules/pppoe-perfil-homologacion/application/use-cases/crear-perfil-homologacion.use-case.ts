import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { CreatePpoePerfilHomologacionDto } from '../../presentation/dto/crear-perfil-homologacion.dto';

import { PerfilHomologacionEntity } from '../../domain/entities/perfil-homologacion.entity';

import {
  PerfilHomologacionRepositoryPort,
  PERFIL_HOMOLOGACION_REPOSITORY,
} from '../../domain/ports/perfil-homologacion-repository.port';

@Injectable()
export class CrearPerfilHomologacionUseCase {
  constructor(
    @Inject(PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfilRepository: PerfilHomologacionRepositoryPort,
  ) {}

  async execute(
    command: CreatePpoePerfilHomologacionDto,
  ): Promise<PerfilHomologacionEntity> {
    const perfilExistente = await this.perfilRepository.findByRouterAndService({
      mikrotikRouterId: command.mikrotikRouterId,
      servicioInternetId: command.servicioInternetId,
    });

    if (perfilExistente) {
      throw new ConflictException(
        'Ya existe una homologación para este MikroTik y servicio de internet.',
      );
    }

    const entity = PerfilHomologacionEntity.create({
      empresaId: command.empresaId,

      mikrotikRouterId: command.mikrotikRouterId,

      servicioInternetId: command.servicioInternetId,

      codigoPerfil: command.codigoPerfil,

      creadoPorId: command.creadoPorId,
    });

    const codigoPerfil = command.codigoPerfil.trim();

    const perfilConMismoCodigo =
      await this.perfilRepository.findByRouterAndCode({
        mikrotikRouterId: command.mikrotikRouterId,
        codigoPerfil,
      });

    if (perfilConMismoCodigo) {
      throw new ConflictException(
        'El código de perfil ya está homologado para otro servicio en este MikroTik.',
      );
    }

    return this.perfilRepository.create(entity);
  }
}
