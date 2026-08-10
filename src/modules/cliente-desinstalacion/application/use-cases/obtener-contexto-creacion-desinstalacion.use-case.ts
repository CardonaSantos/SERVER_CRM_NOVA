import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClienteDesinstalacionContextoRepositoryPort } from '../../domain/ports/cliente-desinstalacion-contexto.repository.port';
import { ContextoCreacionDesinstalacion } from '../../domain/read-models/contexto-creacion-desinstalacion.read-model';
import { CLIENTE_DESINSTALACION_CONTEXTO_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';

@Injectable()
export class ObtenerContextoCreacionDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_CONTEXTO_REPOSITORY)
    private readonly contextoRepository: ClienteDesinstalacionContextoRepositoryPort,
  ) {}

  async execute(clienteId: number): Promise<ContextoCreacionDesinstalacion> {
    const contexto =
      await this.contextoRepository.findContextoCreacionByClienteId(clienteId);

    if (!contexto) {
      throw new NotFoundException(
        `No se encontró el cliente con id ${clienteId}.`,
      );
    }

    return contexto;
  }
}
