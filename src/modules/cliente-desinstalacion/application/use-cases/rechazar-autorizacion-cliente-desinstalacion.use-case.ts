import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';
import { ClienteDesinstalacionAutorizacionEntity } from '../../domain/entities/cliente-desintalacion-autorizacion.entitie';
import { ClienteDesinstalacionAutorizacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion-autorizacion.repository.port';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import {
  CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY,
  CLIENTE_DESINSTALACION_REPOSITORY,
} from '../../infra/tokens/cliente-desinstalacion.token';
import { RechazarDesinstalacionAutorizacionDto } from '../dto/autorizacion-desinstalacion.dto';

export type RechazarAutorizacionDesinstalacionCommand =
  RechazarDesinstalacionAutorizacionDto & {
    id: number;
    autorizadoPorId: number;
  };

@Injectable()
export class RechazarAutorizacionDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY)
    private readonly autorizacionRepository: ClienteDesinstalacionAutorizacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalacionRepository: ClienteDesInstalacionRepositoryPort,
  ) {}

  async execute(command: RechazarAutorizacionDesinstalacionCommand): Promise<{
    autorizacion: ClienteDesinstalacionAutorizacionEntity;
    desinstalacion: ClienteDesinstalacionEntity;
  }> {
    const autorizacion = await this.autorizacionRepository.findById(command.id);

    if (!autorizacion) {
      throw new NotFoundException('Autorización no encontrada.');
    }

    const desinstalacion = await this.desinstalacionRepository.findById(
      autorizacion.desinstalacionId,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    if (desinstalacion.isFinalizada) {
      throw new ConflictException(
        'No se puede rechazar una autorización de una desinstalación finalizada.',
      );
    }

    try {
      autorizacion.rechazar({
        autorizadoPorId: command.autorizadoPorId,
        comentarioAutorizador: command.comentarioAutorizador ?? null,
      });

      desinstalacion.rechazarAutorizacion();
    } catch (error) {
      throw new ConflictException(
        error instanceof Error
          ? error.message
          : 'No se pudo rechazar la autorización.',
      );
    }

    const savedAutorizacion =
      await this.autorizacionRepository.save(autorizacion);

    const savedDesinstalacion =
      await this.desinstalacionRepository.save(desinstalacion);

    return {
      autorizacion: savedAutorizacion,
      desinstalacion: savedDesinstalacion,
    };
  }
}
