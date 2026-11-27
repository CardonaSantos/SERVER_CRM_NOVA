import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { EstadoServicio } from '../../domain/enums/estado-servicio.enum';
import {
  ServicioAdicionalEliminadoError,
  ServicioAdicionalEnUsoError,
  ServicioAdicionalInactivoError,
  ServicioAdicionalNoEncontradoError,
  ServicioAdicionalNombreDuplicadoError,
  TipoServicioNoEncontradoError,
  TipoServicioNombreDuplicadoError,
} from '../../domain/errors/servicio.errors';
import { ServicioAdicionalRepositoryFake } from '../../test/fakes/servicio-adicional-repository.fake';
import { TipoServicioRepositoryFake } from '../../test/fakes/tipo-servicio-repository.fake';
import { ActualizarServicioAdicionalUseCase } from './actualizar-servicio-adicional.use-case';
import { CrearServicioAdicionalUseCase } from './crear-servicio-adicional.use-case';
import { CrearTipoServicioUseCase } from './crear-tipo-servicio.use-case';
import { EliminarServicioAdicionalUseCase } from './eliminar-servicio-adicional.use-case';
import { ListarTiposServicioUseCase } from './listar-tipos-servicio.use-case';
import { VerificarServiciosAsignablesUseCase } from './verificar-servicios-asignables.use-case';

const AHORA = new Date('2026-11-26T18:00:00.000Z');
const { INACTIVO } = EstadoServicio;

describe('servicios adicionales y tipos', () => {
  let servicios: ServicioAdicionalRepositoryFake;
  let tipos: TipoServicioRepositoryFake;
  let unidad: UnidadDeTrabajoEnMemoria;
  const reloj = new RelojFijo(AHORA);

  beforeEach(() => {
    servicios = new ServicioAdicionalRepositoryFake();
    tipos = new TipoServicioRepositoryFake();
    unidad = new UnidadDeTrabajoEnMemoria();
  });

  const crear = () =>
    new CrearServicioAdicionalUseCase(servicios, tipos, unidad, reloj);
  const actualizar = () =>
    new ActualizarServicioAdicionalUseCase(servicios, tipos, unidad, reloj);

  it('crea con un tipo que exista y un nombre libre', async () => {
    const tipo = await new CrearTipoServicioUseCase(tipos, reloj).execute({
      nombre: 'Equipo',
    });
    const alta = { usuarioId: 4, empresaId: 1, nombre: 'Router', precio: 25 };

    await expect(
      crear().execute({ ...alta, tipoServicioId: 99 }),
    ).rejects.toThrow(TipoServicioNoEncontradoError);
    await crear().execute({ ...alta, tipoServicioId: tipo.id });
    await expect(
      crear().execute({ ...alta, nombre: 'router' }),
    ).rejects.toThrow(ServicioAdicionalNombreDuplicadoError);
    expect(servicios.filas.size).toBe(1);
  });

  it('edita lo que llega, comprobando tipo y nombre', async () => {
    const servicioId = servicios.sembrar({ nombre: 'Uno' });
    servicios.sembrar({ nombre: 'Dos' });
    const input = { servicioId, usuarioId: 4 };

    await actualizar().execute({ ...input, cambios: { precio: 40 } });
    await expect(
      actualizar().execute({ ...input, cambios: { tipoServicioId: 99 } }),
    ).rejects.toThrow(TipoServicioNoEncontradoError);
    await expect(
      actualizar().execute({ ...input, cambios: { nombre: 'DOS' } }),
    ).rejects.toThrow(ServicioAdicionalNombreDuplicadoError);

    expect(servicios.filas.get(servicioId)).toMatchObject({
      nombre: 'Uno',
      precio: 40,
      tipoServicioId: null,
    });
  });

  describe('eliminación', () => {
    const eliminar = () =>
      new EliminarServicioAdicionalUseCase(servicios, unidad, reloj);

    it('borra lógicamente uno sin uso', async () => {
      const servicioId = servicios.sembrar();

      await eliminar().execute({ servicioId, usuarioId: 4 });

      expect(servicios.filas.get(servicioId)).toMatchObject({
        eliminadoEn: AHORA,
        eliminadoPorId: 4,
      });
      expect(servicios.pasos).toEqual([
        `exclusivo ${servicioId}`,
        `eliminado ${servicioId}`,
      ]);
    });

    it.each([
      { clientes: 1, facturas: 0 },
      { clientes: 0, facturas: 1 },
    ])('no elimina uno con uso %j', async (uso) => {
      const servicioId = servicios.sembrar();
      servicios.usos.set(servicioId, uso);

      await expect(
        eliminar().execute({ servicioId, usuarioId: 4 }),
      ).rejects.toThrow(ServicioAdicionalEnUsoError);
      expect(servicios.filas.get(servicioId)?.eliminadoEn).toBeNull();
    });
  });

  describe('verificación para otros módulos', () => {
    const verificar = () => new VerificarServiciosAsignablesUseCase(servicios);

    it('bloquea cada uno una vez y en orden', async () => {
      const uno = servicios.sembrar();
      const dos = servicios.sembrar();

      await verificar().execute({ servicioIds: [dos, uno, dos] });

      expect(servicios.pasos).toEqual([
        `compartido ${uno}`,
        `compartido ${dos}`,
      ]);
    });

    it('un inactivo solo se admite a quien ya lo tiene', async () => {
      const servicioId = servicios.sembrar({ estado: INACTIVO });
      servicios.asignados.add(`${servicioId}:7`);

      await expect(
        verificar().execute({ servicioIds: [servicioId], clienteId: 8 }),
      ).rejects.toThrow(ServicioAdicionalInactivoError);
      await expect(
        verificar().execute({ servicioIds: [servicioId], clienteId: 7 }),
      ).resolves.toBeUndefined();
    });

    it('rechaza los eliminados y los inexistentes', async () => {
      const eliminado = servicios.sembrar({ eliminadoEn: AHORA });

      await expect(
        verificar().execute({ servicioIds: [eliminado] }),
      ).rejects.toThrow(ServicioAdicionalEliminadoError);
      await expect(verificar().execute({ servicioIds: [99] })).rejects.toThrow(
        ServicioAdicionalNoEncontradoError,
      );
    });
  });

  it('los tipos no repiten nombre y se listan por nombre', async () => {
    const crearTipo = new CrearTipoServicioUseCase(tipos, reloj);
    await crearTipo.execute({ nombre: 'Soporte' });
    await crearTipo.execute({ nombre: 'Equipo' });

    await expect(crearTipo.execute({ nombre: 'Equipo' })).rejects.toThrow(
      TipoServicioNombreDuplicadoError,
    );
    const lista = await new ListarTiposServicioUseCase(tipos).execute();
    expect(lista.map((tipo) => tipo.nombre)).toEqual(['Equipo', 'Soporte']);
  });
});
