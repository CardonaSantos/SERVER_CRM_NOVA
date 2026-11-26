import { Inject, Injectable } from '@nestjs/common';
import { ClienteDesinstalacionClienteNoEncontradoError } from '../../domain/errors/cliente-desinstalacion.errors';
import {
  CLIENTE_DESINSTALACION_CONTEXTO_QUERY,
  ClienteDesinstalacionContextoQueryPort,
} from '../../domain/ports/cliente-desinstalacion-contexto-query.port';
import { ContextoCreacionDesinstalacion } from '../../domain/read-models/contexto-creacion-desinstalacion.read-model';

/** Lo que la pantalla necesita para armar una desinstalación: accesos, servicios y tickets del cliente. */
@Injectable()
export class ObtenerContextoCreacionDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_CONTEXTO_QUERY)
    private readonly contexto: ClienteDesinstalacionContextoQueryPort,
  ) {}

  async execute(clienteId: number): Promise<ContextoCreacionDesinstalacion> {
    const resultado =
      await this.contexto.findContextoCreacionByClienteId(clienteId);

    if (!resultado) {
      throw new ClienteDesinstalacionClienteNoEncontradoError();
    }

    return resultado;
  }
}
