import {
  ClienteFacadePort,
  MarcarClienteDesinstaladoInput,
} from 'src/modules/cliente/public/cliente.facade.port';

/** Registra a quién se marcó desinstalado; solo lo que usa cliente-desinstalacion. */
export class ClienteFacadeFake implements Partial<ClienteFacadePort> {
  readonly desinstalados: MarcarClienteDesinstaladoInput[] = [];

  marcarDesinstalado(input: MarcarClienteDesinstaladoInput): Promise<void> {
    this.desinstalados.push(input);

    return Promise.resolve();
  }
}
