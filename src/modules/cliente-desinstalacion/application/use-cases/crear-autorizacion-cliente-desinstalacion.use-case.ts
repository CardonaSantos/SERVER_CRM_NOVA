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
import { EstadoAutorizacionDesinstalacion } from '../../domain/enums/estado-autorizacion-desintalacion.enum';

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

    const ultimaAutorizacion =
      await this.autorizacionRepository.findUltimaByDesinstalacionId(
        command.desinstalacionId,
      );

    if (
      ultimaAutorizacion?.estado === EstadoAutorizacionDesinstalacion.PENDIENTE
    ) {
      throw new ConflictException(
        'Ya existe una autorización pendiente para esta desinstalación.',
      );
    }

    if (
      ultimaAutorizacion?.estado === EstadoAutorizacionDesinstalacion.APROBADA
    ) {
      throw new ConflictException(
        'La desinstalación ya cuenta con una autorización aprobada.',
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
