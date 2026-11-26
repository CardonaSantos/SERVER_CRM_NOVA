import { Inject, Injectable } from '@nestjs/common';
import { MotivoDesinstalacionCliente } from '../../domain/enums/motivo-desinstalacion-cliente.enum';
import { ClienteDesinstalacionNoEncontradaError } from '../../domain/errors/cliente-desinstalacion.errors';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  ClienteDesinstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-repository.port';
import {
  ClienteDesinstalacionResumen,
  resumirDesinstalacion,
} from '../../domain/read-models/cliente-desinstalacion-resumen.read-model';

export type ReprogramarClienteDesinstalacionInput = {
  id: number;
  fechaProgramada: string;
  motivo?: MotivoDesinstalacionCliente | null;
  observaciones?: string | null;
};

@Injectable()
export class ReprogramarClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,
  ) {}

  async execute(
    input: ReprogramarClienteDesinstalacionInput,
  ): Promise<ClienteDesinstalacionResumen> {
    const desinstalacion = await this.desinstalaciones.findById(input.id);

    if (!desinstalacion) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    desinstalacion.reprogramar({
      fechaProgramada: new Date(input.fechaProgramada),
      motivo: input.motivo ?? null,
      observaciones: input.observaciones ?? null,
    });

    return resumirDesinstalacion(
      await this.desinstalaciones.save(desinstalacion),
    );
  }
}
