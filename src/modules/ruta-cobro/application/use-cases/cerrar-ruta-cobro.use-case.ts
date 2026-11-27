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
import { RutaCobroProps } from '../../domain/props/ruta-cobro.props';
import {
  RUTA_COBRO_EVENTOS,
  RutaCobroEventosPort,
} from '../ports/ruta-cobro-eventos.port';

export type CerrarRutaCobroInput = { rutaId: number; usuarioId: number };

@Injectable()
export class CerrarRutaCobroUseCase {
  private readonly logger = new Logger(CerrarRutaCobroUseCase.name);

  constructor(
    @Inject(RUTA_COBRO_REPOSITORY)
    private readonly rutas: RutaCobroRepositoryPort,
    @Inject(RUTA_COBRO_EVENTOS)
    private readonly eventos: RutaCobroEventosPort,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: CerrarRutaCobroInput): Promise<RutaCobroProps> {
    const ruta = await this.unidad.ejecutar(async () => {
      await this.rutas.bloquearParaModificar(input.rutaId);
      const actual = await this.rutas.findById(input.rutaId);
      if (!actual) throw new RutaCobroNoEncontradaError();

      actual.cerrar(this.reloj.ahora());
      await this.rutas.update(actual);

      return actual;
    });

    this.logger.log(
      `Ruta de cobro ${input.rutaId} cerrada por el usuario ${input.usuarioId}.`,
    );
    await this.eventos.rutaCambiada(ruta.empresaId, input.rutaId);

    return ruta.toPrimitives();
  }
}
