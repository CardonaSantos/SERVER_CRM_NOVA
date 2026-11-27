import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { SectorEntity } from '../../domain/entities/sector.entity';
import {
  MunicipioNoEncontradoError,
  SectorConClientesError,
  SectorNoEncontradoError,
  SectorNombreDuplicadoError,
} from '../../domain/errors/ubicacion.errors';
import {
  DIVISION_TERRITORIAL_QUERY,
  DivisionTerritorialQueryPort,
} from '../../domain/ports/division-territorial-query.port';
import {
  SECTOR_REPOSITORY,
  SectorRepositoryPort,
} from '../../domain/ports/sector-repository.port';
import { ActualizarSectorProps } from '../../domain/props/sector.props';

export type ActualizarSectorInput = {
  sectorId: number;
  usuarioId: number;
  cambios: ActualizarSectorProps;
};

/**
 * Lo que no llega no cambia. Un sector con clientes no cambia de municipio. Los
 * nombres antiguos que no cumplan las reglas se conservan mientras no cambien.
 */
@Injectable()
export class ActualizarSectorUseCase {
  private readonly logger = new Logger(ActualizarSectorUseCase.name);

  constructor(
    @Inject(SECTOR_REPOSITORY)
    private readonly sectores: SectorRepositoryPort,
    @Inject(DIVISION_TERRITORIAL_QUERY)
    private readonly division: DivisionTerritorialQueryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: ActualizarSectorInput): Promise<SectorEntity> {
    const guardado = await this.unidad.ejecutar(async () => {
      // El bloqueo espera a quien lo esté asignando; el conteo ya lo ve.
      await this.sectores.bloquearParaModificar(input.sectorId);
      const sector = await this.sectores.findById(input.sectorId);
      if (!sector) throw new SectorNoEncontradoError();

      const anterior = sector.toPrimitives();
      sector.actualizar(input.cambios, this.reloj.ahora());

      const cambiaMunicipio = sector.municipioId !== anterior.municipioId;
      if (cambiaMunicipio) {
        if (!(await this.division.findMunicipio(sector.municipioId))) {
          throw new MunicipioNoEncontradoError();
        }
        const clientes = await this.sectores.contarClientes(input.sectorId);
        if (clientes > 0) throw new SectorConClientesError(clientes);
      }

      const cambiaNombre =
        sector.nombre.toLowerCase() !== anterior.nombre.trim().toLowerCase();
      if (cambiaNombre || cambiaMunicipio) {
        await this.sectores.bloquearNombres();
        if (
          await this.sectores.existeNombre(
            sector.nombre,
            sector.municipioId,
            input.sectorId,
          )
        ) {
          throw new SectorNombreDuplicadoError();
        }
      }

      return this.sectores.update(sector);
    });

    this.logger.log(
      `Sector ${input.sectorId} actualizado por el usuario ${input.usuarioId}.`,
    );

    return guardado;
  }
}
