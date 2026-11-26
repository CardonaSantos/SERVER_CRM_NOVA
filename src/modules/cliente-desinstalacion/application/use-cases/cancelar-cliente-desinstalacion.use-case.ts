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

export type CancelarClienteDesinstalacionInput = {
  id: number;
  motivo?: MotivoDesinstalacionCliente | null;
  observaciones?: string | null;
  fechaCancelacion?: string;
};

@Injectable()
export class CancelarClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CancelarClienteDesinstalacionInput,
  ): Promise<ClienteDesinstalacionResumen> {
    const desinstalacion = await this.desinstalaciones.findById(input.id);

    if (!desinstalacion) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    desinstalacion.cancelar({
      fechaCancelacion: input.fechaCancelacion
        ? new Date(input.fechaCancelacion)
        : this.reloj.ahora(),
      motivo: input.motivo ?? null,
      observaciones: input.observaciones ?? null,
    });

    return resumirDesinstalacion(
      await this.desinstalaciones.save(desinstalacion),
    );
  }
}
