import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import {
  MunicipioNoEncontradoError,
  SectorConClientesError,
  SectorEliminadoError,
  SectorEnUsoError,
  SectorNoEncontradoError,
  SectorNombreDuplicadoError,
} from '../../domain/errors/ubicacion.errors';
import { DivisionTerritorialQueryFake } from '../../test/fakes/division-territorial-query.fake';
import { SectorRepositoryFake } from '../../test/fakes/sector-repository.fake';
import { ActualizarSectorUseCase } from './actualizar-sector.use-case';
import { CrearSectorUseCase } from './crear-sector.use-case';
import { EliminarSectorUseCase } from './eliminar-sector.use-case';

const AHORA = new Date('2026-11-26T18:00:00.000Z');

describe('sectores', () => {
  let sectores: SectorRepositoryFake;
  let division: DivisionTerritorialQueryFake;
  let unidad: UnidadDeTrabajoEnMemoria;
  const reloj = new RelojFijo(AHORA);

  beforeEach(() => {
    sectores = new SectorRepositoryFake();
    division = new DivisionTerritorialQueryFake();
    unidad = new UnidadDeTrabajoEnMemoria();
  });

  describe('alta', () => {
    const crear = () =>
      new CrearSectorUseCase(sectores, division, unidad, reloj);
    const alta = { usuarioId: 4, nombre: 'Centro', municipioId: 10 };

    it('crea en un municipio que exista', async () => {
      const sector = await crear().execute(alta);

      expect(sectores.filas.get(sector.id!)).toMatchObject({
        nombre: 'Centro',
        municipioId: 10,
      });
      await expect(
        crear().execute({ ...alta, municipioId: 99 }),
      ).rejects.toThrow(MunicipioNoEncontradoError);
    });

    it('el nombre solo se repite en otro municipio', async () => {
      sectores.sembrar({ nombre: 'Centro', municipioId: 10 });

      await expect(
        crear().execute({ ...alta, nombre: 'CENTRO' }),
      ).rejects.toThrow(SectorNombreDuplicadoError);
      await expect(
        crear().execute({ ...alta, municipioId: 11 }),
      ).resolves.toBeTruthy();
    });
  });

  describe('edición', () => {
    const actualizar = () =>
      new ActualizarSectorUseCase(sectores, division, unidad, reloj);

    it('bloquea el sector y cambia solo lo que llega', async () => {
      const sectorId = sectores.sembrar({ nombre: 'Centro' });
      sectores.clientes.set(sectorId, 30);

      await actualizar().execute({
        sectorId,
        usuarioId: 4,
        cambios: { nombre: 'centro', descripcion: 'x', municipioId: 10 },
      });

      expect(sectores.filas.get(sectorId)).toMatchObject({
        nombre: 'centro',
        descripcion: 'x',
        municipioId: 10,
      });
      expect(sectores.pasos).toEqual([`exclusivo ${sectorId}`]);
    });

    it('con clientes no cambia de municipio', async () => {
      const sectorId = sectores.sembrar();
      sectores.clientes.set(sectorId, 1);

      await expect(
        actualizar().execute({
          sectorId,
          usuarioId: 4,
          cambios: { municipioId: 11 },
        }),
      ).rejects.toThrow(SectorConClientesError);
      expect(sectores.filas.get(sectorId)?.municipioId).toBe(10);
    });

    it('sin clientes cambia a un municipio que exista y sin repetir nombre', async () => {
      const sectorId = sectores.sembrar({ nombre: 'Centro' });
      sectores.sembrar({ nombre: 'Centro', municipioId: 11 });
      const mudar = (municipioId: number) =>
        actualizar().execute({
          sectorId,
          usuarioId: 4,
          cambios: { municipioId },
        });

      await expect(mudar(99)).rejects.toThrow(MunicipioNoEncontradoError);
      await expect(mudar(11)).rejects.toThrow(SectorNombreDuplicadoError);
      await expect(mudar(20)).resolves.toBeTruthy();
    });

    it('responde no encontrado o eliminado', async () => {
      const eliminado = sectores.sembrar({ eliminadoEn: AHORA });
      const input = { usuarioId: 4, cambios: {} };

      await expect(
        actualizar().execute({ ...input, sectorId: 99 }),
      ).rejects.toThrow(SectorNoEncontradoError);
      await expect(
        actualizar().execute({ ...input, sectorId: eliminado }),
      ).rejects.toThrow(SectorEliminadoError);
    });
  });

  describe('eliminación', () => {
    const eliminar = () => new EliminarSectorUseCase(sectores, unidad, reloj);

    it('borra lógicamente un sector sin clientes, con la fila bloqueada', async () => {
      const sectorId = sectores.sembrar();

      await expect(
        eliminar().execute({ sectorId, usuarioId: 4 }),
      ).resolves.toEqual({ sectorId, eliminadoEn: AHORA });
      expect(sectores.filas.get(sectorId)?.eliminadoPorId).toBe(4);
      expect(sectores.pasos).toEqual([
        `exclusivo ${sectorId}`,
        `eliminado ${sectorId}`,
      ]);
    });

    it('no elimina un sector con clientes', async () => {
      const sectorId = sectores.sembrar();
      sectores.clientes.set(sectorId, 163);

      await expect(
        eliminar().execute({ sectorId, usuarioId: 4 }),
      ).rejects.toThrow(SectorEnUsoError);
      expect(sectores.filas.get(sectorId)?.eliminadoEn).toBeNull();
    });
  });
});
