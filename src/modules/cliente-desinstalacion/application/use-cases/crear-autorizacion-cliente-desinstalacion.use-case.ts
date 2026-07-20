import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClienteDesinstalacionAutorizacionEntity } from '../../domain/entities/cliente-desintalacion-autorizacion.entitie';
import { ClienteDesinstalacionAutorizacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion-autorizacion.repository.port';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import {
  CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY,
  CLIENTE_DESINSTALACION_REPOSITORY,
} from '../../infra/tokens/cliente-desinstalacion.token';
import { SolicitarDesinstalacionAutorizacionDto } from '../dto/autorizacion-desinstalacion.dto';

export type CrearAutorizacionDesinstalacionCommand =
  SolicitarDesinstalacionAutorizacionDto & {
    desinstalacionId: number;
    solicitadoPorId?: number | null;
  };

@Injectable()
export class CrearAutorizacionDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalacionRepository: ClienteDesInstalacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY)
    private readonly autorizacionRepository: ClienteDesinstalacionAutorizacionRepositoryPort,
  ) {}

  async execute(command: CrearAutorizacionDesinstalacionCommand) {
    const desinstalacion = await this.desinstalacionRepository.findById(
      command.desinstalacionId,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    if (desinstalacion.isFinalizada) {
      throw new ConflictException(
        'No se puede crear autorización para una desinstalación finalizada.',
      );
    }

    const pendiente =
      await this.autorizacionRepository.findPendienteByDesinstalacionId(
        command.desinstalacionId,
      );

    if (pendiente) {
      throw new ConflictException(
        'Ya existe una autorización pendiente para esta desinstalación.',
      );
    }

    const autorizacion = ClienteDesinstalacionAutorizacionEntity.create({
      desinstalacionId: command.desinstalacionId,
      solicitadoPorId: command.solicitadoPorId ?? null,
      motivoSolicitud: command.motivoSolicitud ?? null,
    });

    return this.autorizacionRepository.create(autorizacion);
  }
}
