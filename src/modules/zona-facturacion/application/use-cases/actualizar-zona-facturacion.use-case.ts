import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { ZonaFacturacionNoEncontradaError } from '../../domain/errors/zona-facturacion.errors';
import {
  ZONA_FACTURACION_REPOSITORY,
  ZonaFacturacionRepositoryPort,
} from '../../domain/ports/zona-facturacion-repository.port';
import {
  ConfigurarZonaFacturacionProps,
  ZonaFacturacionProps,
} from '../../domain/props/zona-facturacion.props';

export type ActualizarZonaFacturacionInput = {
  zonaId: number;
  cambios: ConfigurarZonaFacturacionProps;
};

/** Edición de una zona: lo que no llega no se modifica. */
@Injectable()
export class ActualizarZonaFacturacionUseCase {
  constructor(
    @Inject(ZONA_FACTURACION_REPOSITORY)
    private readonly zonas: ZonaFacturacionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: ActualizarZonaFacturacionInput,
  ): Promise<ZonaFacturacionProps> {
    const zona = await this.zonas.findById(input.zonaId);
    if (!zona) throw new ZonaFacturacionNoEncontradaError();

    zona.configurar(input.cambios, this.reloj.ahora());

    return (await this.zonas.update(zona)).toPrimitives();
  }
}
