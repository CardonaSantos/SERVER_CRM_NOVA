import {
  DepartamentoNoEncontradoError,
  MunicipioDeOtroDepartamentoError,
  MunicipioNoEncontradoError,
  SectorDeOtroMunicipioError,
  SectorEliminadoError,
  SectorNoEncontradoError,
} from '../../domain/errors/ubicacion.errors';
import { DivisionTerritorialQueryFake } from '../../test/fakes/division-territorial-query.fake';
import { SectorRepositoryFake } from '../../test/fakes/sector-repository.fake';
import { VerificarUbicacionAsignadaUseCase } from './verificar-ubicacion-asignada.use-case';

describe('VerificarUbicacionAsignadaUseCase', () => {
  let sectores: SectorRepositoryFake;
  let verificar: VerificarUbicacionAsignadaUseCase;
  const base = { departamentoId: 1, municipioId: 10, sectorId: null };

  beforeEach(() => {
    sectores = new SectorRepositoryFake();
    verificar = new VerificarUbicacionAsignadaUseCase(
      sectores,
      new DivisionTerritorialQueryFake(),
    );
  });

  it('acepta una ubicación que cuadra y bloquea el sector', async () => {
    const sectorId = sectores.sembrar({ municipioId: 10 });

    await verificar.execute({ nueva: { ...base, sectorId } });

    expect(sectores.pasos).toEqual([`compartido ${sectorId}`]);
  });

  it.each([
    [{ departamentoId: 9 }, DepartamentoNoEncontradoError],
    [{ municipioId: 99 }, MunicipioNoEncontradoError],
    [{ municipioId: 20 }, MunicipioDeOtroDepartamentoError],
    [{ sectorId: 99 }, SectorNoEncontradoError],
  ])('rechaza %j', async (cambio, error) => {
    await expect(
      verificar.execute({ nueva: { ...base, ...cambio } }),
    ).rejects.toThrow(error);
  });

  it('rechaza un sector de otro municipio o eliminado', async () => {
    const ajeno = sectores.sembrar({ municipioId: 11 });
    const eliminado = sectores.sembrar({
      municipioId: 10,
      eliminadoEn: new Date('2026-11-01T00:00:00Z'),
    });

    await expect(
      verificar.execute({ nueva: { ...base, sectorId: ajeno } }),
    ).rejects.toThrow(SectorDeOtroMunicipioError);
    await expect(
      verificar.execute({ nueva: { ...base, sectorId: eliminado } }),
    ).rejects.toThrow(SectorEliminadoError);
  });

  it('conserva una combinación antigua que no cuadra mientras no se toque', async () => {
    const ajeno = sectores.sembrar({ municipioId: 11 });
    const antigua = { ...base, sectorId: ajeno };

    await expect(
      verificar.execute({ nueva: antigua, anterior: antigua }),
    ).resolves.toBeUndefined();
  });

  it('al mudar de municipio exige cambiar o quitar el sector', async () => {
    const sectorId = sectores.sembrar({ municipioId: 10 });
    const anterior = { ...base, sectorId };

    await expect(
      verificar.execute({
        nueva: { ...anterior, municipioId: 11 },
        anterior,
      }),
    ).rejects.toThrow(SectorDeOtroMunicipioError);
    await expect(
      verificar.execute({
        nueva: { ...anterior, municipioId: 11, sectorId: null },
        anterior,
      }),
    ).resolves.toBeUndefined();
  });
});
