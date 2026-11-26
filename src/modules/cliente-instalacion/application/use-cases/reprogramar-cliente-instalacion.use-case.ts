import { Inject, Injectable } from '@nestjs/common';
import { ClienteInstalacionNoEncontradaError } from '../../domain/errors/cliente-instalacion.errors';
import {
  CLIENTE_INSTALACION_REPOSITORY,
  ClienteInstalacionRepositoryPort,
} from '../../domain/ports/cliente-instalacion-repository.port';
import {
  ClienteInstalacionResumen,
  resumirInstalacion,
} from '../../domain/read-models/cliente-instalacion-resumen.read-model';

export type ReprogramarClienteInstalacionInput = {
  id: number;
  fechaProgramada: string | Date;
  motivo?: string | null;
};

@Injectable()
export class ReprogramarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalaciones: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(
    input: ReprogramarClienteInstalacionInput,
  ): Promise<ClienteInstalacionResumen> {
    const instalacion = await this.instalaciones.findById(input.id);

    if (!instalacion) {
      throw new ClienteInstalacionNoEncontradaError();
    }

    instalacion.reprogramar({
      fechaProgramada: new Date(input.fechaProgramada),
      motivo: input.motivo,
    });

    return resumirInstalacion(await this.instalaciones.save(instalacion));
  }
}
