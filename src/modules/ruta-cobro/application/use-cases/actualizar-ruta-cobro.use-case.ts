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
  EditarRutaCobroProps,
  RutaCobroProps,
} from '../../domain/props/ruta-cobro.props';
import {
  RUTA_COBRO_EVENTOS,
  RutaCobroEventosPort,
} from '../ports/ruta-cobro-eventos.port';
import { ValidadorReferenciasRutaService } from '../services/validador-referencias-ruta.service';

export type ActualizarRutaCobroInput = {
  rutaId: number;
  usuarioId: number;
  cambios: EditarRutaCobroProps;
};

/** Edición de una ruta: lo que no llega no se modifica. */
@Injectable()
export class ActualizarRutaCobroUseCase {
  private readonly logger = new Logger(ActualizarRutaCobroUseCase.name);

  constructor(
    @Inject(RUTA_COBRO_REPOSITORY)
    private readonly rutas: RutaCobroRepositoryPort,
    private readonly referencias: ValidadorReferenciasRutaService,
    @Inject(RUTA_COBRO_EVENTOS)
    private readonly eventos: RutaCobroEventosPort,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: ActualizarRutaCobroInput): Promise<RutaCobroProps> {
    const ruta = await this.unidad.ejecutar(async () => {
      await this.rutas.bloquearParaModificar(input.rutaId);
      const actual = await this.rutas.findById(input.rutaId);
      if (!actual) throw new RutaCobroNoEncontradaError();

      const cobradorAnterior = actual.cobradorId;
      actual.editar(input.cambios, this.reloj.ahora());
      const cambiaClientes = input.cambios.clienteIds !== undefined;

      await this.referencias.verificar({
        // Conservar al cobrador actual no exige que siga activo.
        cobradorId:
          actual.cobradorId !== cobradorAnterior ? actual.cobradorId : null,
        clienteIds: cambiaClientes
          ? actual.toPrimitives().clienteIds
          : undefined,
      });
      await this.rutas.update(actual, { clientes: cambiaClientes });

      return actual;
    });

    this.logger.log(
      `Ruta de cobro ${input.rutaId} editada por el usuario ${input.usuarioId}.`,
    );
    await this.eventos.rutaCambiada(ruta.empresaId, input.rutaId);

    return ruta.toPrimitives();
  }
}
