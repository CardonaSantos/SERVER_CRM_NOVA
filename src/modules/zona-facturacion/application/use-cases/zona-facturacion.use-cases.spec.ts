import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import {
  ZonaFacturacionEliminadaError,
  ZonaFacturacionEnUsoError,
  ZonaFacturacionNoEncontradaError,
} from '../../domain/errors/zona-facturacion.errors';
import {
  DATOS_ZONA,
  ZonaFacturacionRepositoryFake,
} from '../../test/fakes/zona-facturacion-repository.fake';
import { ActualizarZonaFacturacionUseCase } from './actualizar-zona-facturacion.use-case';
import { CrearZonaFacturacionUseCase } from './crear-zona-facturacion.use-case';
import { EliminarZonaFacturacionUseCase } from './eliminar-zona-facturacion.use-case';
import { VerificarZonaFacturacionAsignableUseCase } from './verificar-zona-facturacion-asignable.use-case';

const AHORA = new Date('2026-11-26T18:00:00Z');

describe('Casos de uso de zonas de facturación', () => {
  let zonas: ZonaFacturacionRepositoryFake;
  let reloj: RelojFijo;

  beforeEach(() => {
    zonas = new ZonaFacturacionRepositoryFake();
    reloj = new RelojFijo(AHORA);
  });

  it('crea una zona', async () => {
    const zona = await new CrearZonaFacturacionUseCase(zonas, reloj).execute(
      DATOS_ZONA,
    );

    expect(zona.id).toBe(1);
    expect(zonas.filas.get(1)).toMatchObject({
      nombre: DATOS_ZONA.nombre,
      creadoEn: AHORA,
    });
  });

  describe('actualizar', () => {
    const caso = () => new ActualizarZonaFacturacionUseCase(zonas, reloj);

    it('guarda solo lo que llega', async () => {
      const id = zonas.sembrar();

      await caso().execute({ zonaId: id, cambios: { diaPago: 25 } });

      expect(zonas.filas.get(id)).toMatchObject({
        nombre: DATOS_ZONA.nombre,
        diaPago: 25,
        actualizadoEn: AHORA,
      });
    });

    it('rechaza una zona inexistente o eliminada', async () => {
      const id = zonas.sembrar({ eliminadoEn: AHORA });

      await expect(caso().execute({ zonaId: 99, cambios: {} })).rejects.toThrow(
        ZonaFacturacionNoEncontradaError,
      );
      await expect(
        caso().execute({ zonaId: id, cambios: { diaPago: 2 } }),
      ).rejects.toThrow(ZonaFacturacionEliminadaError);
    });
  });

  describe('eliminar', () => {
    const caso = () => new EliminarZonaFacturacionUseCase(zonas, reloj);

    it('marca la zona vacía sin borrarla', async () => {
      const id = zonas.sembrar();

      await expect(
        caso().execute({ zonaId: id, usuarioId: 7 }),
      ).resolves.toEqual({ zonaId: id, eliminadoEn: AHORA });
      expect(zonas.filas.get(id)).toMatchObject({
        eliminadoEn: AHORA,
        eliminadoPorId: 7,
      });
    });

    it.each([
      { clientes: 1, facturas: 0 },
      { clientes: 0, facturas: 3 },
    ])('la bloquea si tiene uso %p', async (uso) => {
      const id = zonas.sembrar();
      zonas.usos.set(id, uso);

      await expect(
        caso().execute({ zonaId: id, usuarioId: 7 }),
      ).rejects.toThrow(ZonaFacturacionEnUsoError);
      expect(zonas.filas.get(id)!.eliminadoEn).toBeNull();
    });

    it('rechaza una zona inexistente o ya eliminada', async () => {
      const id = zonas.sembrar({ eliminadoEn: AHORA });

      await expect(
        caso().execute({ zonaId: 99, usuarioId: 7 }),
      ).rejects.toThrow(ZonaFacturacionNoEncontradaError);
      await expect(
        caso().execute({ zonaId: id, usuarioId: 7 }),
      ).rejects.toThrow(ZonaFacturacionEliminadaError);
    });
  });

  it('solo una zona activa admite clientes', async () => {
    const caso = new VerificarZonaFacturacionAsignableUseCase(zonas);
    const activa = zonas.sembrar();
    const eliminada = zonas.sembrar({ eliminadoEn: AHORA });

    await expect(caso.execute(activa)).resolves.toBeUndefined();
    expect(zonas.bloqueadas).toEqual([activa]);
    await expect(caso.execute(eliminada)).rejects.toThrow(
      ZonaFacturacionEliminadaError,
    );
    await expect(caso.execute(99)).rejects.toThrow(
      ZonaFacturacionNoEncontradaError,
    );
  });
});
