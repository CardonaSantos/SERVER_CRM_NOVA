import { Inject, Injectable } from '@nestjs/common';
import {
  AutorizacionDesinstalacionPendiente,
  ClienteDesinstalacionAutorizacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-autorizacion.repository.port';
import { CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';

@Injectable()
export class ListarAutorizacionesPendientesUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY)
    private readonly autorizacionRepository: ClienteDesinstalacionAutorizacionRepositoryPort,
  ) {}

  async execute(): Promise<AutorizacionDesinstalacionPendiente[]> {
    return this.autorizacionRepository.findPendientes();
  }
}
