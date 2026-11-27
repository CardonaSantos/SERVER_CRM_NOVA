import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { RutaCobroNoEncontradaError } from '../../domain/errors/ruta-cobro.errors';
import {
  RUTA_COBRO_REPOSITORY,
  RutaCobroRepositoryPort,
} from '../../domain/ports/ruta-cobro-repository.port';
import {
  RUTA_COBRO_EVENTOS,
  RutaCobroEventosPort,
} from '../ports/ruta-cobro-eventos.port';

export type EliminarRutaCobroInput = { rutaId: number; usuarioId: number };

export type EliminarRutaCobroResult = { rutaId: number; eliminadoEn: Date };

/** Borrado lógico en cualquier estado. La fila y sus pagos se conservan. */
@Injectable()
export class EliminarRutaCobroUseCase {
  private readonly logger = new Logger(EliminarRutaCobroUseCase.name);

  constructor(
    @Inject(RUTA_COBRO_REPOSITORY)
    private readonly rutas: RutaCobroRepositoryPort,
    @Inject(RUTA_COBRO_EVENTOS)
    private readonly eventos: RutaCobroEventosPort,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: EliminarRutaCobroInput,
  ): Promise<EliminarRutaCobroResult> {
    const ahora = this.reloj.ahora();

    const empresaId = await this.unidad.ejecutar(async () => {
      await this.rutas.bloquearParaModificar(input.rutaId);
      const actual = await this.rutas.findById(input.rutaId);
      if (!actual) throw new RutaCobroNoEncontradaError();

      actual.eliminar(input.usuarioId, ahora);
      await this.rutas.update(actual);

      return actual.empresaId;
    });

    this.logger.log(
      `Ruta de cobro ${input.rutaId} eliminada por el usuario ${input.usuarioId}.`,
    );
    await this.eventos.rutaCambiada(empresaId, input.rutaId);

    return { rutaId: input.rutaId, eliminadoEn: ahora };
  }
}
