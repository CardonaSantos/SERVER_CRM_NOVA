import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { EstadoServicio } from '../../domain/enums/estado-servicio.enum';
import {
  PlanInternetEliminadoError,
  PlanInternetEnUsoError,
  PlanInternetInactivoError,
  PlanInternetInvalidoError,
  PlanInternetNoEncontradoError,
  PlanInternetNombreDuplicadoError,
} from '../../domain/errors/servicio.errors';
import {
  PlanInternetRepositoryFake,
  SIN_USO,
} from '../../test/fakes/plan-internet-repository.fake';
import { ReautenticacionOperadorPort } from '../ports/reautenticacion-operador.port';
import { ActualizarPlanInternetUseCase } from './actualizar-plan-internet.use-case';
import { CambiarPrecioPlanInternetUseCase } from './cambiar-precio-plan-internet.use-case';
import { CrearPlanInternetUseCase } from './crear-plan-internet.use-case';
import { EliminarPlanInternetUseCase } from './eliminar-plan-internet.use-case';
import { VerificarPlanInternetUseCase } from './verificar-plan-internet.use-case';

const AHORA = new Date('2026-11-26T18:00:00.000Z');
const { ACTIVO, INACTIVO } = EstadoServicio;

describe('planes de internet', () => {
  let planes: PlanInternetRepositoryFake;
  let unidad: UnidadDeTrabajoEnMemoria;
  const reloj = new RelojFijo(AHORA);

  beforeEach(() => {
    planes = new PlanInternetRepositoryFake();
    unidad = new UnidadDeTrabajoEnMemoria();
  });

  describe('alta', () => {
    const crear = () => new CrearPlanInternetUseCase(planes, unidad, reloj);
    const alta = { usuarioId: 4, empresaId: 1, precio: 200 };

    it('crea el plan comprobando el nombre dentro de la unidad', async () => {
      const plan = await crear().execute({ ...alta, nombre: 'Nuevo' });

      expect(planes.filas.get(plan.id!)).toMatchObject({
        nombre: 'Nuevo',
        precio: 200,
        estado: ACTIVO,
      });
      expect(planes.pasos).toEqual(['nombres']);
      expect(unidad.aperturas).toHaveLength(1);
    });

    it('rechaza un nombre que ya usa otro plan vigente', async () => {
      planes.sembrar({ nombre: 'Hogar' });

      await expect(
        crear().execute({ ...alta, nombre: ' HOGAR ' }),
      ).rejects.toThrow(PlanInternetNombreDuplicadoError);
      expect(planes.filas.size).toBe(1);
    });

    it('permite reutilizar el nombre de un plan eliminado', async () => {
      planes.sembrar({ nombre: 'Hogar', eliminadoEn: AHORA });

      await expect(
        crear().execute({ ...alta, nombre: 'Hogar' }),
      ).resolves.toBeTruthy();
    });
  });

  describe('edición', () => {
    const actualizar = () =>
      new ActualizarPlanInternetUseCase(planes, unidad, reloj);

    it('bloquea el plan, cambia solo lo que llega y no toca el precio', async () => {
      const planId = planes.sembrar({ precio: 150 });

      await actualizar().execute({
        planId,
        usuarioId: 4,
        cambios: { estado: INACTIVO },
      });

      expect(planes.filas.get(planId)).toMatchObject({
        estado: INACTIVO,
        precio: 150,
        velocidad: '20 Mbps',
      });
      expect(planes.pasos).toEqual([`exclusivo ${planId}`]);
    });

    it('los nombres ya repetidos se pueden editar si no cambian', async () => {
      const planId = planes.sembrar({ nombre: 'PLAN NUEVO' });
      planes.sembrar({ nombre: 'PLAN NUEVO' });

      await expect(
        actualizar().execute({
          planId,
          usuarioId: 4,
          cambios: { nombre: 'plan nuevo', velocidad: '50 Mbps' },
        }),
      ).resolves.toBeTruthy();
    });

    it('no permite renombrar a un nombre usado', async () => {
      const planId = planes.sembrar({ nombre: 'Uno' });
      planes.sembrar({ nombre: 'Dos' });

      await expect(
        actualizar().execute({
          planId,
          usuarioId: 4,
          cambios: { nombre: 'dos' },
        }),
      ).rejects.toThrow(PlanInternetNombreDuplicadoError);
      expect(planes.filas.get(planId)?.nombre).toBe('Uno');
    });

    it('responde no encontrado o eliminado', async () => {
      const eliminado = planes.sembrar({ eliminadoEn: AHORA });
      const input = { usuarioId: 4, cambios: {} };

      await expect(
        actualizar().execute({ ...input, planId: 99 }),
      ).rejects.toThrow(PlanInternetNoEncontradoError);
      await expect(
        actualizar().execute({ ...input, planId: eliminado }),
      ).rejects.toThrow(PlanInternetEliminadoError);
    });
  });

  describe('cambio de precio', () => {
    let confirmaciones: [number, string][];
    let reautenticacion: ReautenticacionOperadorPort;
    const cambiar = () =>
      new CambiarPrecioPlanInternetUseCase(
        planes,
        reautenticacion,
        unidad,
        reloj,
      );

    beforeEach(() => {
      confirmaciones = [];
      reautenticacion = {
        confirmar: (usuarioId, contrasena) => {
          confirmaciones.push([usuarioId, contrasena]);
          return contrasena === 'correcta'
            ? Promise.resolve()
            : Promise.reject(new Error('credenciales'));
        },
      };
    });

    it('cambia el precio y dice a cuántos clientes afecta', async () => {
      const planId = planes.sembrar({ precio: 150 });
      planes.clientes.set(planId, { total: 259, facturables: 241 });

      await expect(
        cambiar().execute({
          planId,
          usuarioId: 4,
          precio: 175,
          contrasenaActual: 'correcta',
        }),
      ).resolves.toEqual({
        planId,
        precioAnterior: 150,
        precioNuevo: 175,
        clientes: { total: 259, facturables: 241 },
      });
      expect(planes.filas.get(planId)?.precio).toBe(175);
      expect(confirmaciones).toEqual([[4, 'correcta']]);
    });

    it('sin la contraseña correcta no toca nada', async () => {
      const planId = planes.sembrar({ precio: 150 });

      await expect(
        cambiar().execute({
          planId,
          usuarioId: 4,
          precio: 175,
          contrasenaActual: 'mala',
        }),
      ).rejects.toThrow('credenciales');
      expect(planes.filas.get(planId)?.precio).toBe(150);
      expect(unidad.aperturas).toHaveLength(0);
    });

    it('el mismo precio no escribe y un precio negativo se rechaza', async () => {
      const planId = planes.sembrar({ precio: 150 });
      const input = { planId, usuarioId: 4, contrasenaActual: 'correcta' };

      await cambiar().execute({ ...input, precio: 150 });
      await expect(cambiar().execute({ ...input, precio: -1 })).rejects.toThrow(
        PlanInternetInvalidoError,
      );

      expect(planes.pasos).not.toContain(`precio ${planId}`);
      expect(planes.filas.get(planId)?.precio).toBe(150);
    });
  });

  describe('eliminación', () => {
    const eliminar = () =>
      new EliminarPlanInternetUseCase(planes, unidad, reloj);

    it('borra lógicamente un plan nunca usado, con la fila bloqueada', async () => {
      const planId = planes.sembrar();

      await expect(
        eliminar().execute({ planId, usuarioId: 4 }),
      ).resolves.toEqual({ planId, eliminadoEn: AHORA });
      expect(planes.filas.get(planId)).toMatchObject({
        eliminadoEn: AHORA,
        eliminadoPorId: 4,
        estado: INACTIVO,
      });
      expect(planes.pasos).toEqual([
        `exclusivo ${planId}`,
        `eliminado ${planId}`,
      ]);
    });

    it.each([
      'clientes',
      'accesos',
      'instalaciones',
      'desinstalaciones',
      'homologaciones',
    ] as const)('no elimina un plan con %s', async (uso) => {
      const planId = planes.sembrar();
      planes.usos.set(planId, { ...SIN_USO, [uso]: 1 });

      await expect(
        eliminar().execute({ planId, usuarioId: 4 }),
      ).rejects.toThrow(PlanInternetEnUsoError);
      expect(planes.filas.get(planId)?.eliminadoEn).toBeNull();
    });

    it('no elimina dos veces ni lo que no existe', async () => {
      const planId = planes.sembrar({ eliminadoEn: AHORA });

      await expect(
        eliminar().execute({ planId, usuarioId: 4 }),
      ).rejects.toThrow(PlanInternetEliminadoError);
      await expect(
        eliminar().execute({ planId: 99, usuarioId: 4 }),
      ).rejects.toThrow(PlanInternetNoEncontradoError);
    });
  });

  describe('verificación para otros módulos', () => {
    const verificar = () => new VerificarPlanInternetUseCase(planes);

    it('bloquea el plan antes de leerlo', async () => {
      const planId = planes.sembrar();

      await verificar().execute({ planId, paraAsignar: true });

      expect(planes.pasos).toEqual([`compartido ${planId}`]);
    });

    it('un inactivo solo se admite a quien ya lo tiene', async () => {
      const planId = planes.sembrar({ estado: INACTIVO });
      planes.asignados.add(`${planId}:7`);

      await expect(
        verificar().execute({ planId, paraAsignar: true }),
      ).rejects.toThrow(PlanInternetInactivoError);
      await expect(
        verificar().execute({ planId, paraAsignar: true, clienteId: 8 }),
      ).rejects.toThrow(PlanInternetInactivoError);
      await expect(
        verificar().execute({ planId, paraAsignar: true, clienteId: 7 }),
      ).resolves.toBeUndefined();
    });

    it('como dato histórico vale un inactivo, no un eliminado', async () => {
      const inactivo = planes.sembrar({ estado: INACTIVO });
      const eliminado = planes.sembrar({ eliminadoEn: AHORA });

      await expect(
        verificar().execute({ planId: inactivo, paraAsignar: false }),
      ).resolves.toBeUndefined();
      await expect(
        verificar().execute({ planId: eliminado, paraAsignar: false }),
      ).rejects.toThrow(PlanInternetEliminadoError);
      await expect(
        verificar().execute({ planId: 99, paraAsignar: false }),
      ).rejects.toThrow(PlanInternetNoEncontradoError);
    });
  });
});
