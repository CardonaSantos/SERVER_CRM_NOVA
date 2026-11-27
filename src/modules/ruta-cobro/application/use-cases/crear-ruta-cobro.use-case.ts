import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { RutaCobroEntity } from '../../domain/entities/ruta-cobro.entity';
import {
  RUTA_COBRO_REPOSITORY,
  RutaCobroRepositoryPort,
} from '../../domain/ports/ruta-cobro-repository.port';
import {
  CrearRutaCobroProps,
  RutaCobroProps,
} from '../../domain/props/ruta-cobro.props';
import {
  RUTA_COBRO_EVENTOS,
  RutaCobroEventosPort,
} from '../ports/ruta-cobro-eventos.port';
import { ValidadorReferenciasRutaService } from '../services/validador-referencias-ruta.service';

export type CrearRutaCobroInput = CrearRutaCobroProps & { usuarioId: number };

@Injectable()
export class CrearRutaCobroUseCase {
  private readonly logger = new Logger(CrearRutaCobroUseCase.name);

  constructor(
    @Inject(RUTA_COBRO_REPOSITORY)
    private readonly rutas: RutaCobroRepositoryPort,
    private readonly referencias: ValidadorReferenciasRutaService,
    @Inject(RUTA_COBRO_EVENTOS)
    private readonly eventos: RutaCobroEventosPort,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: CrearRutaCobroInput): Promise<RutaCobroProps> {
    const { usuarioId, ...datos } = input;
    const nueva = RutaCobroEntity.create(datos, this.reloj.ahora());
    const { cobradorId, clienteIds } = nueva.toPrimitives();

    const guardada = await this.unidad.ejecutar(async () => {
      await this.referencias.verificar({ cobradorId, clienteIds });

      return this.rutas.create(nueva);
    });

    this.logger.log(
      `Ruta de cobro ${guardada.id} creada por el usuario ${usuarioId}.`,
    );
    await this.eventos.rutaCambiada(guardada.empresaId, guardada.id!);

    return guardada.toPrimitives();
  }
}
