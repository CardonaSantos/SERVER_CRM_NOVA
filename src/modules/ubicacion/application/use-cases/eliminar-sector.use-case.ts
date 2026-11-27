import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import {
  SectorEnUsoError,
  SectorNoEncontradoError,
} from '../../domain/errors/ubicacion.errors';
import {
  SECTOR_REPOSITORY,
  SectorRepositoryPort,
} from '../../domain/ports/sector-repository.port';

export type EliminarSectorInput = {
  sectorId: number;
  usuarioId: number;
};

export type EliminarSectorResult = {
  sectorId: number;
  eliminadoEn: Date;
};

/**
 * Borrado lógico de un sector sin clientes (ni siquiera eliminados). La fila
 * nunca se borra.
 */
@Injectable()
export class EliminarSectorUseCase {
  private readonly logger = new Logger(EliminarSectorUseCase.name);

  constructor(
    @Inject(SECTOR_REPOSITORY)
    private readonly sectores: SectorRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: EliminarSectorInput): Promise<EliminarSectorResult> {
    const ahora = this.reloj.ahora();

    await this.unidad.ejecutar(async () => {
      // El bloqueo espera a quien lo esté asignando; el conteo ya lo ve.
      await this.sectores.bloquearParaModificar(input.sectorId);
      const sector = await this.sectores.findById(input.sectorId);
      if (!sector) throw new SectorNoEncontradoError();
      sector.asegurarVigente();

      const clientes = await this.sectores.contarClientes(input.sectorId);
      if (clientes > 0) throw new SectorEnUsoError(clientes);

      sector.eliminar(input.usuarioId, ahora);
      await this.sectores.eliminar(sector);
    });

    this.logger.log(
      `Sector ${input.sectorId} eliminado por el usuario ${input.usuarioId}.`,
    );

    return { sectorId: input.sectorId, eliminadoEn: ahora };
  }
}
