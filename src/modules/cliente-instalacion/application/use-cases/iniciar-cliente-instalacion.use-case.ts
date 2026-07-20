import { Inject, Injectable } from '@nestjs/common';
import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';
import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';
import { IniciarInstalacionClienteDto } from '../dto/iniciar-instalacion.dto';

export type IniciarInstalacionClienteCommand = IniciarInstalacionClienteDto & {
  id: number;
};

@Injectable()
export class IniciarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly clienteInstalacion: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(command: IniciarInstalacionClienteCommand) {
    const instalacion = await this.clienteInstalacion.findById({
      id: command.id,
    });

    instalacion.iniciar();

    return this.clienteInstalacion.save(instalacion);
  }
}
