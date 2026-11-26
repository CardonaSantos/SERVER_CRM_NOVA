import { Injectable } from '@nestjs/common';
import {
  ClienteFacadePort,
  MarcarClienteDesinstaladoInput,
  SincronizarEstadoOperativoClienteInput,
} from '../../public/cliente.facade.port';
import { MarcarClienteDesinstaladoUseCase } from '../use-cases/marcar-cliente-desinstalado.use-case';
import { SincronizarEstadoOperativoClienteUseCase } from '../use-cases/sincronizar-estado-operativo-cliente.use-case';

@Injectable()
export class ClienteFacade implements ClienteFacadePort {
  constructor(
    private readonly sincronizar: SincronizarEstadoOperativoClienteUseCase,
    private readonly desinstalar: MarcarClienteDesinstaladoUseCase,
  ) {}

  sincronizarEstadoOperativo(
    input: SincronizarEstadoOperativoClienteInput,
  ): Promise<void> {
    return this.sincronizar.execute(input);
  }

  marcarDesinstalado(input: MarcarClienteDesinstaladoInput): Promise<void> {
    return this.desinstalar.execute(input);
  }
}
