import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClienteDesinstalacionAutorizacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion-autorizacion.repository.port';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import {
  CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY,
  CLIENTE_DESINSTALACION_REPOSITORY,
} from '../../infra/tokens/cliente-desinstalacion.token';
import { SolicitarDesinstalacionAutorizacionDto } from '../dto/autorizacion-desinstalacion.dto';
import { ClienteDesinstalacionAutorizacionEntity } from '../../domain/entities/cliente-desintalacion-autorizacion.entitie';

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

    const autorizacion = ClienteDesinstalacionAutorizacionEntity.create({
      desinstalacionId: command.desinstalacionId,
      solicitadoPorId: command.solicitadoPorId ?? null,
      motivoSolicitud: command.motivoSolicitud ?? null,
    });

    return this.autorizacionRepository.create(autorizacion);
  }
}
