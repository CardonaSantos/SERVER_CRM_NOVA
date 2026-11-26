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
import { ValidarAutorizacionDesinstalacionService } from '../services/validar-autorizacion-desinstalacion.service';

export type IniciarClienteDesinstalacionInput = {
  id: number;
  ejecutadoPorId: number;
  fechaInicio?: string;
};

/**
 * El trabajo físico solo empieza con una autorización aprobada; la baja PPPoE
 * ya ocurrió al aprobarla.
 */
@Injectable()
export class IniciarClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,

    private readonly autorizacion: ValidarAutorizacionDesinstalacionService,
  ) {}

  async execute(
    input: IniciarClienteDesinstalacionInput,
  ): Promise<ClienteDesinstalacionResumen> {
    const desinstalacion = await this.desinstalaciones.findById(input.id);

    if (!desinstalacion) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    await this.autorizacion.exigirAprobada(input.id);

    desinstalacion.iniciar({
      ejecutadoPorId: input.ejecutadoPorId,
      fechaInicio: input.fechaInicio
        ? new Date(input.fechaInicio)
        : this.reloj.ahora(),
    });

    return resumirDesinstalacion(
      await this.desinstalaciones.save(desinstalacion),
    );
  }
}
