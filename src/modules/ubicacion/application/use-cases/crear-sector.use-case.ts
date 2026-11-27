import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { SectorEntity } from '../../domain/entities/sector.entity';
import {
  MunicipioNoEncontradoError,
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
import { CrearSectorProps } from '../../domain/props/sector.props';

export type CrearSectorInput = CrearSectorProps & { usuarioId: number };

@Injectable()
export class CrearSectorUseCase {
  private readonly logger = new Logger(CrearSectorUseCase.name);

  constructor(
    @Inject(SECTOR_REPOSITORY)
    private readonly sectores: SectorRepositoryPort,
    @Inject(DIVISION_TERRITORIAL_QUERY)
    private readonly division: DivisionTerritorialQueryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: CrearSectorInput): Promise<SectorEntity> {
    const nuevo = SectorEntity.create(input, this.reloj.ahora());

    const creado = await this.unidad.ejecutar(async () => {
      if (!(await this.division.findMunicipio(input.municipioId))) {
        throw new MunicipioNoEncontradoError();
      }

      await this.sectores.bloquearNombres();
      if (await this.sectores.existeNombre(nuevo.nombre, input.municipioId)) {
        throw new SectorNombreDuplicadoError();
      }

      return this.sectores.create(nuevo);
    });

    this.logger.log(
      `Sector ${creado.id} creado por el usuario ${input.usuarioId}.`,
    );

    return creado;
  }
}
