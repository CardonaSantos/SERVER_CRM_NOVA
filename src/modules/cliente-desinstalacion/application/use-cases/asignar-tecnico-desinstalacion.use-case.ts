import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClienteDesinstalacionTecnicoEntity } from '../../domain/entities/cliente-desinstalacion-tecnico.entity';
import { ClienteDesinstalacionTecnicoRepositoryPort } from '../../domain/ports/cliente-desinstalacion-tecnico.repository.port';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  CLIENTE_DESINSTALACION_TECNICO_REPOSITORY,
} from '../../infra/tokens/cliente-desinstalacion.token';
import { AsignarTecnicoDesinstalacionDto } from '../dto/tecnico-desinstalacion.dto';

export type AsignarTecnicoDesinstalacionCommand =
  AsignarTecnicoDesinstalacionDto & {
    desinstalacionId: number;
  };

@Injectable()
export class AsignarTecnicoDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalacionRepository: ClienteDesInstalacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_TECNICO_REPOSITORY)
    private readonly tecnicoRepository: ClienteDesinstalacionTecnicoRepositoryPort,
  ) {}

  async execute(command: AsignarTecnicoDesinstalacionCommand) {
    const desinstalacion = await this.desinstalacionRepository.findById(
      command.desinstalacionId,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    if (desinstalacion.isFinalizada) {
      throw new ConflictException(
        'No se pueden asignar técnicos a una desinstalación finalizada.',
      );
    }

    if (command.esResponsable) {
      const actuales = await this.tecnicoRepository.findByDesinstalacionId(
        command.desinstalacionId,
      );

      const yaTieneResponsable = actuales.some(
        (tecnico) => tecnico.esResponsable,
      );

      if (yaTieneResponsable) {
        throw new ConflictException(
          'La desinstalación ya tiene un técnico responsable.',
        );
      }
    }

    const tecnico = ClienteDesinstalacionTecnicoEntity.create({
      desinstalacionId: command.desinstalacionId,
      tecnicoId: command.tecnicoId ?? null,
      rol: command.rol,
      esResponsable: command.esResponsable ?? false,
      tiempoMinutos: command.tiempoMinutos ?? null,
      observaciones: command.observaciones ?? null,
      tecnicoNombreSnapshot: command.tecnicoNombreSnapshot ?? null,
    });

    return this.tecnicoRepository.create(tecnico);
  }
}
