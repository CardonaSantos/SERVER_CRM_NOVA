import { Inject, Injectable } from '@nestjs/common';
import {
  CLIENTE_LISTADO_QUERY,
  ClienteListadoQueryPort,
} from '../../domain/ports/cliente-listado-query.port';
import { ClienteOpcion } from '../../domain/read-models/cliente-listado.read-model';

/** Clientes para un selector (por ejemplo, al abrir un ticket). */
@Injectable()
export class ListarOpcionesClienteUseCase {
  constructor(
    @Inject(CLIENTE_LISTADO_QUERY)
    private readonly consulta: ClienteListadoQueryPort,
  ) {}

  execute(): Promise<ClienteOpcion[]> {
    return this.consulta.findOpciones();
  }
}
