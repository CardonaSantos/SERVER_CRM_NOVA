import { Inject, Injectable } from '@nestjs/common';
import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';
import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';
import { CompletarClienteInstalacionDto } from '../dto/completar-cliente-instalacion.dto';

export type CompletarClienteInstalacion = CompletarClienteInstalacionDto & {
  id: number;
};

@Injectable()
export class CompletarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly clienteInstalacion: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(command: CompletarClienteInstalacion) {
    const instalacion = await this.clienteInstalacion.findById({
      id: command.id,
    });

    instalacion.completar({
      ...command,
    });

    return this.clienteInstalacion.save(instalacion);
  }
}
