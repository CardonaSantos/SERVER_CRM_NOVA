import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
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

export type MarcarFallidaClienteDesinstalacionInput = {
  id: number;
  motivo?: MotivoDesinstalacionCliente | null;
  resultado?: string | null;
  observaciones?: string | null;
  fechaFinalizacion?: string;
};

@Injectable()
export class MarcarFallidaClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: MarcarFallidaClienteDesinstalacionInput,
  ): Promise<ClienteDesinstalacionResumen> {
    const desinstalacion = await this.desinstalaciones.findById(input.id);

    if (!desinstalacion) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    desinstalacion.marcarFallida({
      motivo: input.motivo ?? null,
      resultado: input.resultado ?? null,
      observaciones: input.observaciones ?? null,
      fechaFinalizacion: input.fechaFinalizacion
        ? new Date(input.fechaFinalizacion)
        : this.reloj.ahora(),
    });

    return resumirDesinstalacion(
      await this.desinstalaciones.save(desinstalacion),
    );
  }
}
