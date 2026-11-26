import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { ClienteInstalacionNoEncontradaError } from '../../domain/errors/cliente-instalacion.errors';
import {
  CLIENTE_INSTALACION_REPOSITORY,
  ClienteInstalacionRepositoryPort,
} from '../../domain/ports/cliente-instalacion-repository.port';
import {
  ClienteInstalacionResumen,
  resumirInstalacion,
} from '../../domain/read-models/cliente-instalacion-resumen.read-model';

export type CancelarClienteInstalacionInput = {
  id: number;
  motivo: string;
  observaciones?: string | null;
  fechaCancelacion?: string | Date;
};

@Injectable()
export class CancelarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalaciones: ClienteInstalacionRepositoryPort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CancelarClienteInstalacionInput,
  ): Promise<ClienteInstalacionResumen> {
    const instalacion = await this.instalaciones.findById(input.id);

    if (!instalacion) {
      throw new ClienteInstalacionNoEncontradaError();
    }

    instalacion.cancelar({
      motivo: input.motivo,
      observaciones: input.observaciones,
      fechaCancelacion: input.fechaCancelacion
        ? new Date(input.fechaCancelacion)
        : this.reloj.ahora(),
    });

    return resumirInstalacion(await this.instalaciones.save(instalacion));
  }
}
