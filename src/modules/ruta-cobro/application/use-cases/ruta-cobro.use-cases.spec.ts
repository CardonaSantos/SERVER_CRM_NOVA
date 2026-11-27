import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { EstadoRutaCobro } from '../../domain/enums/estado-ruta-cobro.enum';
import {
  RutaCobroCerradaError,
  RutaCobroClienteAjenoError,
  RutaCobroClientesInvalidosError,
  RutaCobroCobradorInvalidoError,
  RutaCobroEliminadaError,
  RutaCobroNoEncontradaError,
} from '../../domain/errors/ruta-cobro.errors';
import {
  ReferenciaRutaFake,
  RutaCobroEventosFake,
  RutaCobroRepositoryFake,
} from '../../test/fakes/ruta-cobro.fake';
import { ValidadorReferenciasRutaService } from '../services/validador-referencias-ruta.service';
import { ActualizarRutaCobroUseCase } from './actualizar-ruta-cobro.use-case';
import { CerrarRutaCobroUseCase } from './cerrar-ruta-cobro.use-case';
import { CrearRutaCobroUseCase } from './crear-ruta-cobro.use-case';
import { EliminarRutaCobroUseCase } from './eliminar-ruta-cobro.use-case';
import { VerificarCobroRutaUseCase } from './verificar-cobro-ruta.use-case';

const AHORA = new Date('2026-11-26T18:00:00.000Z');

describe('rutas de cobro', () => {
  let rutas: RutaCobroRepositoryFake;
  let referencias: ReferenciaRutaFake;
  let eventos: RutaCobroEventosFake;
  let unidad: UnidadDeTrabajoEnMemoria;
  const reloj = new RelojFijo(AHORA);

  beforeEach(() => {
    rutas = new RutaCobroRepositoryFake();
    referencias = new ReferenciaRutaFake();
    eventos = new RutaCobroEventosFake();
    unidad = new UnidadDeTrabajoEnMemoria();
  });

  const validador = () => new ValidadorReferenciasRutaService(referencias);
  const crear = () =>
    new CrearRutaCobroUseCase(rutas, validador(), eventos, unidad, reloj);
  const actualizar = () =>
    new ActualizarRutaCobroUseCase(rutas, validador(), eventos, unidad, reloj);
  const cerrar = () =>
    new CerrarRutaCobroUseCase(rutas, eventos, unidad, reloj);
  const eliminar = () =>
    new EliminarRutaCobroUseCase(rutas, eventos, unidad, reloj);
  const verificar = () => new VerificarCobroRutaUseCase(rutas);

  describe('crear', () => {
    const alta = {
      usuarioId: 2,
      empresaId: 1,
      nombre: 'Norte',
      cobradorId: 4,
      clienteIds: [7, 8],
    };

    it('guarda la ruta y avisa', async () => {
      const ruta = await crear().execute(alta);

      expect(rutas.filas.get(ruta.id!)).toMatchObject({
        estado: EstadoRutaCobro.ASIGNADA,
        clienteIds: [7, 8],
        creadoEn: AHORA,
      });
      expect(eventos.avisos).toEqual([{ empresaId: 1, rutaId: ruta.id }]);
      expect(unidad.aperturas).toHaveLength(1);
    });

    it('rechaza un cobrador inexistente o inactivo', async () => {
      await expect(
        crear().execute({ ...alta, cobradorId: 99 }),
      ).rejects.toThrow(RutaCobroCobradorInvalidoError);
      expect(rutas.filas.size).toBe(0);
      expect(eventos.avisos).toHaveLength(0);
    });

    it('rechaza clientes inexistentes o eliminados', async () => {
      await expect(
        crear().execute({ ...alta, clienteIds: [7, 99] }),
      ).rejects.toThrow(RutaCobroClientesInvalidosError);
      expect(rutas.filas.size).toBe(0);
    });
  });

  describe('actualizar', () => {
    it('no toca cobrador ni clientes si no llegan', async () => {
      const id = rutas.sembrar();

      await actualizar().execute({
        rutaId: id,
        usuarioId: 2,
        cambios: { nombre: 'Sur' },
      });

      expect(rutas.filas.get(id)).toMatchObject({
        nombre: 'Sur',
        cobradorId: 4,
        clienteIds: [7, 8],
      });
      expect(rutas.escriturasDeClientes).toEqual([false]);
      expect(rutas.bloqueos).toEqual([`modificar:${id}`]);
    });

    it('deja conservar un cobrador que quedó inactivo', async () => {
      const id = rutas.sembrar({ cobradorId: 99 });

      await expect(
        actualizar().execute({
          rutaId: id,
          usuarioId: 2,
          cambios: { cobradorId: 99, nombre: 'Sur' },
        }),
      ).resolves.toBeTruthy();
    });

    it('rechaza asignar un cobrador inactivo', async () => {
      const id = rutas.sembrar();

      await expect(
        actualizar().execute({
          rutaId: id,
          usuarioId: 2,
          cambios: { cobradorId: 99 },
        }),
      ).rejects.toThrow(RutaCobroCobradorInvalidoError);
      expect(rutas.filas.get(id)!.cobradorId).toBe(4);
    });

    it('reemplaza los clientes cuando llegan', async () => {
      const id = rutas.sembrar();

      await actualizar().execute({
        rutaId: id,
        usuarioId: 2,
        cambios: { clienteIds: [9] },
      });

      expect(rutas.filas.get(id)!.clienteIds).toEqual([9]);
      expect(rutas.escriturasDeClientes).toEqual([true]);
    });

    it('rechaza una ruta inexistente', async () => {
      await expect(
        actualizar().execute({ rutaId: 99, usuarioId: 2, cambios: {} }),
      ).rejects.toThrow(RutaCobroNoEncontradaError);
    });
  });

  describe('cerrar y eliminar', () => {
    it('cierra una ruta abierta una sola vez', async () => {
      const id = rutas.sembrar();

      await cerrar().execute({ rutaId: id, usuarioId: 2 });

      expect(rutas.filas.get(id)!.estado).toBe(EstadoRutaCobro.CERRADO);
      await expect(
        cerrar().execute({ rutaId: id, usuarioId: 2 }),
      ).rejects.toThrow(RutaCobroCerradaError);
      expect(eventos.avisos).toHaveLength(1);
    });

    it('elimina sin borrar la fila ni sus clientes', async () => {
      const id = rutas.sembrar();

      const resultado = await eliminar().execute({ rutaId: id, usuarioId: 5 });

      expect(resultado).toEqual({ rutaId: id, eliminadoEn: AHORA });
      expect(rutas.filas.get(id)).toMatchObject({
        eliminadoEn: AHORA,
        eliminadoPorId: 5,
        clienteIds: [7, 8],
      });
      await expect(
        eliminar().execute({ rutaId: id, usuarioId: 5 }),
      ).rejects.toThrow(RutaCobroEliminadaError);
    });

    it('falla con una ruta inexistente', async () => {
      await expect(
        cerrar().execute({ rutaId: 99, usuarioId: 2 }),
      ).rejects.toThrow(RutaCobroNoEncontradaError);
      await expect(
        eliminar().execute({ rutaId: 99, usuarioId: 2 }),
      ).rejects.toThrow(RutaCobroNoEncontradaError);
    });
  });

  describe('verificar cobro', () => {
    it('admite a un cliente de una ruta abierta, bloqueándola', async () => {
      const id = rutas.sembrar();

      await expect(
        verificar().execute({ rutaId: id, clienteId: 7 }),
      ).resolves.toBe(true);
      expect(rutas.bloqueos).toEqual([`cobrar:${id}`]);
    });

    it('una ruta inexistente o eliminada no existe', async () => {
      const eliminada = rutas.sembrar({ eliminadoEn: AHORA });

      await expect(
        verificar().execute({ rutaId: eliminada, clienteId: 7 }),
      ).resolves.toBe(false);
      await expect(
        verificar().execute({ rutaId: 99, clienteId: 7 }),
      ).resolves.toBe(false);
    });

    it('rechaza una ruta cerrada o un cliente ajeno', async () => {
      const cerrada = rutas.sembrar({ estado: EstadoRutaCobro.CERRADO });
      const abierta = rutas.sembrar();

      await expect(
        verificar().execute({ rutaId: cerrada, clienteId: 7 }),
      ).rejects.toThrow(RutaCobroCerradaError);
      await expect(
        verificar().execute({ rutaId: abierta, clienteId: 99 }),
      ).rejects.toThrow(RutaCobroClienteAjenoError);
    });
  });
});
