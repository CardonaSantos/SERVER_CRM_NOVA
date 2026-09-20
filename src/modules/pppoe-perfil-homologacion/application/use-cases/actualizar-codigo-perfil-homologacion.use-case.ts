import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PerfilHomologacionEntity } from '../../domain/entities/ppoe-perfil-homologacion.entity';
import { PerfilHomologacionRepositoryPort } from '../../domain/ports/ppoe-perfil-homologacion.port';
import { PPPOE_PERFIL_HOMOLOGACION_REPOSITORY } from '../../infra/tokens/ppoe-perfil-homologacion.token';
import { UpdatePpoePerfilHomologacionDto } from '../dto/update-ppoe-perfil-homologacion.dto';

export type ActualizarCodigoPerfilHomologacionCommand =
  UpdatePpoePerfilHomologacionDto & {
    id: number;
  };

@Injectable()
export class ActualizarCodigoPerfilHomologacionUseCase {
  constructor(
    @Inject(PPPOE_PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfilRepository: PerfilHomologacionRepositoryPort,
  ) {}

  async execute(
    command: ActualizarCodigoPerfilHomologacionCommand,
  ): Promise<PerfilHomologacionEntity> {
    const perfil = await this.perfilRepository.findById(command.id);

    if (!perfil) {
      throw new NotFoundException(
        `No existe una homologación PPPoE con id ${command.id}.`,
      );
    }

    const codigoPerfil = command.codigoPerfil.trim();

    /*
     * Si el código no cambió, evitamos una escritura innecesaria
     * y no modificamos actualizadoEn.
     */
    if (codigoPerfil === perfil.codigoPerfil) {
      return perfil;
    }

    const perfilConMismoCodigo =
      await this.perfilRepository.findByRouterAndCode({
        mikrotikRouterId: perfil.mikrotikRouterId,
        codigoPerfil,
      });

    if (perfilConMismoCodigo && perfilConMismoCodigo.id !== perfil.id) {
      throw new ConflictException(
        'El código de perfil ya está homologado para otro servicio en este MikroTik.',
      );
    }

    perfil.actualizarCodigoPerfil(codigoPerfil, command.actualizadoPorId);

    return this.perfilRepository.update(perfil);
  }
}
