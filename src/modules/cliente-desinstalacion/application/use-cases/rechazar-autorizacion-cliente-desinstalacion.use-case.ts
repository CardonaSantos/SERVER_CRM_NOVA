import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import {
  AutorizacionDesinstalacionConflictoError,
  AutorizacionDesinstalacionNoEncontradaError,
  ClienteDesinstalacionNoEncontradaError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import {
  CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY,
  ClienteDesinstalacionAutorizacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-autorizacion-repository.port';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  ClienteDesinstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-repository.port';
import {
  AutorizacionDesinstalacionResumen,
  ClienteDesinstalacionResumen,
  resumirAutorizacion,
  resumirDesinstalacion,
} from '../../domain/read-models/cliente-desinstalacion-resumen.read-model';

export type RechazarAutorizacionDesinstalacionInput = {
  id: number;
  autorizadoPorId: number;
  comentarioAutorizador?: string | null;
};

export type RechazarAutorizacionDesinstalacionResult = {
  autorizacion: AutorizacionDesinstalacionResumen;
  desinstalacion: ClienteDesinstalacionResumen;
};

/** Rechazar la solicitud cancela la desinstalación programada; las dos cosas van juntas. */
@Injectable()
export class RechazarAutorizacionDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY)
    private readonly autorizaciones: ClienteDesinstalacionAutorizacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,

    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: RechazarAutorizacionDesinstalacionInput,
  ): Promise<RechazarAutorizacionDesinstalacionResult> {
    const autorizacion = await this.autorizaciones.findById(input.id);

    if (!autorizacion) {
      throw new AutorizacionDesinstalacionNoEncontradaError();
    }

    const desinstalacion = await this.desinstalaciones.findById(
      autorizacion.desinstalacionId,
    );

    if (!desinstalacion) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    if (desinstalacion.isFinalizada) {
      throw new AutorizacionDesinstalacionConflictoError(
        'No se puede rechazar una autorización de una desinstalación finalizada.',
      );
    }

    const ahora = this.reloj.ahora();

    autorizacion.rechazar({
      autorizadoPorId: input.autorizadoPorId,
      comentarioAutorizador: input.comentarioAutorizador ?? null,
      fechaRespuesta: ahora,
    });
    desinstalacion.rechazarAutorizacion(ahora);

    const [autorizacionGuardada, desinstalacionGuardada] =
      await this.unidad.ejecutar(async () => [
        await this.autorizaciones.save(autorizacion),
        await this.desinstalaciones.save(desinstalacion),
      ]);

    return {
      autorizacion: resumirAutorizacion(autorizacionGuardada),
      desinstalacion: resumirDesinstalacion(desinstalacionGuardada),
    };
  }
}
