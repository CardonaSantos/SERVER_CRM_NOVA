import { Inject, Injectable } from '@nestjs/common';
import { CLIENTE_INSTALACION_REPOSITORY, ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion-repository.port';
import { CancelarClienteInstalacionDto } from '../../presentation/dto/cancelar-cliente-instalacion.dto';

export type CancelarClienteInstalacionCommand =
  CancelarClienteInstalacionDto & {
    id: number;
  };

@Injectable()
export class CancelarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly clienteInstalacionRepo: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(command: CancelarClienteInstalacionCommand) {
    const instalacion = await this.clienteInstalacionRepo.findById({
      id: command.id,
    });

    instalacion.cancelar({
      ...command,
    });

    return this.clienteInstalacionRepo.save(instalacion);
  }
}
