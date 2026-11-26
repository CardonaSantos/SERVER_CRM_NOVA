import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClienteDesinstalacionContextoRepositoryPort, CLIENTE_DESINSTALACION_CONTEXTO_QUERY } from '../../domain/ports/cliente-desinstalacion-contexto-query.port';
import { ContextoCreacionDesinstalacion } from '../../domain/read-models/contexto-creacion-desinstalacion.read-model';

@Injectable()
export class ObtenerContextoCreacionDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_CONTEXTO_QUERY)
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
