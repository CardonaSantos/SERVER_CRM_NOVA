import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { ClienteDesinstalacionNoEncontradaError } from '../../domain/errors/cliente-desinstalacion.errors';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  ClienteDesinstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-repository.port';
import {
  ClienteDesinstalacionResumen,
  resumirDesinstalacion,
} from '../../domain/read-models/cliente-desinstalacion-resumen.read-model';

export type CompletarClienteDesinstalacionInput = {
  id: number;
  ejecutadoPorId: number;
  resultado?: string | null;
  observaciones?: string | null;
  fechaFinalizacion?: string;
  equipoRecuperado?: boolean;
  conforme?: boolean | null;
};

/** Cierra el trabajo físico; no repite la baja PPPoE (esa ya ocurrió al aprobar). */
@Injectable()
export class CompletarClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CompletarClienteDesinstalacionInput,
  ): Promise<ClienteDesinstalacionResumen> {
    const desinstalacion = await this.desinstalaciones.findById(input.id);

    if (!desinstalacion) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    desinstalacion.completar({
      ejecutadoPorId: input.ejecutadoPorId,
      resultado: input.resultado,
      observaciones: input.observaciones,
      fechaFinalizacion: input.fechaFinalizacion
        ? new Date(input.fechaFinalizacion)
        : this.reloj.ahora(),
      equipoRecuperado: input.equipoRecuperado,
      conforme: input.conforme,
    });

    return resumirDesinstalacion(
      await this.desinstalaciones.save(desinstalacion),
    );
  }
}
