import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClienteDesinstalacionTecnicoRepositoryPort, CLIENTE_DESINSTALACION_TECNICO_REPOSITORY } from '../../domain/ports/cliente-desinstalacion-tecnico-repository.port';
import { ClienteDesInstalacionRepositoryPort, CLIENTE_DESINSTALACION_REPOSITORY } from '../../domain/ports/cliente-desinstalacion-repository.port';

@Injectable()
export class EliminarTecnicoDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalacionRepository: ClienteDesInstalacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_TECNICO_REPOSITORY)
    private readonly tecnicoRepository: ClienteDesinstalacionTecnicoRepositoryPort,
  ) {}

  async execute(params: {
    desinstalacionId: number;
    tecnicoOperacionId: number;
  }): Promise<void> {
    const desinstalacion = await this.desinstalacionRepository.findById(
      params.desinstalacionId,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    if (desinstalacion.isFinalizada) {
      throw new ConflictException(
        'No se pueden eliminar técnicos de una desinstalación finalizada.',
      );
    }

    await this.tecnicoRepository.deleteById(params);
  }
}
