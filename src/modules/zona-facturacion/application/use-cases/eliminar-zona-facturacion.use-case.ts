import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  ZonaFacturacionEnUsoError,
  ZonaFacturacionNoEncontradaError,
} from '../../domain/errors/zona-facturacion.errors';
import {
  ZONA_FACTURACION_REPOSITORY,
  ZonaFacturacionRepositoryPort,
} from '../../domain/ports/zona-facturacion-repository.port';

export type EliminarZonaFacturacionInput = {
  zonaId: number;
  usuarioId: number;
};

export type EliminarZonaFacturacionResult = {
  zonaId: number;
  eliminadoEn: Date;
};

/**
 * Borrado lógico de una zona sin clientes (ni siquiera eliminados) ni
 * facturas. La fila nunca se borra.
 */
@Injectable()
export class EliminarZonaFacturacionUseCase {
  private readonly logger = new Logger(EliminarZonaFacturacionUseCase.name);

  constructor(
    @Inject(ZONA_FACTURACION_REPOSITORY)
    private readonly zonas: ZonaFacturacionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: EliminarZonaFacturacionInput,
  ): Promise<EliminarZonaFacturacionResult> {
    const zona = await this.zonas.findById(input.zonaId);
    if (!zona) throw new ZonaFacturacionNoEncontradaError();
    zona.asegurarActiva();

    const uso = await this.zonas.contarUso(input.zonaId);
    if (uso.clientes > 0 || uso.facturas > 0) {
      throw new ZonaFacturacionEnUsoError(uso);
    }

    const ahora = this.reloj.ahora();
    zona.eliminar(input.usuarioId, ahora);
    await this.zonas.eliminar(zona);

    this.logger.log(
      `Zona ${input.zonaId} eliminada por el usuario ${input.usuarioId}.`,
    );

    return { zonaId: input.zonaId, eliminadoEn: ahora };
  }
}
