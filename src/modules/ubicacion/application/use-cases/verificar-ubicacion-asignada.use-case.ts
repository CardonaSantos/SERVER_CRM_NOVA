import { Inject, Injectable } from '@nestjs/common';
import {
  DepartamentoNoEncontradoError,
  MunicipioDeOtroDepartamentoError,
  MunicipioNoEncontradoError,
  SectorDeOtroMunicipioError,
  SectorNoEncontradoError,
} from '../../domain/errors/ubicacion.errors';
import { comprobacionesDe } from '../../domain/policies/coherencia-ubicacion.policy';
import {
  DIVISION_TERRITORIAL_QUERY,
  DivisionTerritorialQueryPort,
} from '../../domain/ports/division-territorial-query.port';
import {
  SECTOR_REPOSITORY,
  SectorRepositoryPort,
} from '../../domain/ports/sector-repository.port';
import { VerificarUbicacionInput } from '../../public/ubicacion.facade.port';

/**
 * Confirma que una ubicación existe y cuadra y, dentro de una unidad de
 * trabajo, impide que el sector se elimine o mude hasta que esta termine.
 */
@Injectable()
export class VerificarUbicacionAsignadaUseCase {
  constructor(
    @Inject(SECTOR_REPOSITORY)
    private readonly sectores: SectorRepositoryPort,
    @Inject(DIVISION_TERRITORIAL_QUERY)
    private readonly division: DivisionTerritorialQueryPort,
  ) {}

  async execute({ nueva, anterior }: VerificarUbicacionInput): Promise<void> {
    const comprobar = comprobacionesDe(nueva, anterior);
    const { departamentoId, municipioId, sectorId } = nueva;

    if (
      comprobar.departamento &&
      !(await this.division.findDepartamento(departamentoId!))
    ) {
      throw new DepartamentoNoEncontradoError();
    }

    if (comprobar.municipio) {
      const municipio = await this.division.findMunicipio(municipioId!);
      if (!municipio) throw new MunicipioNoEncontradoError();
      if (
        departamentoId !== null &&
        municipio.departamentoId !== departamentoId
      ) {
        throw new MunicipioDeOtroDepartamentoError();
      }
    }

    if (comprobar.sector) {
      await this.sectores.bloquearParaAsignar(sectorId!);
      const sector = await this.sectores.findById(sectorId!);
      if (!sector) throw new SectorNoEncontradoError();
      sector.asegurarVigente();
      if (municipioId !== null && sector.municipioId !== municipioId) {
        throw new SectorDeOtroMunicipioError();
      }
    }
  }
}
