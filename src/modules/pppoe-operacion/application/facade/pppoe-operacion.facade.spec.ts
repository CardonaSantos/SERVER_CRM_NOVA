import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.types';

import {
  EstadoOperacionPppoe,
  EstadoPasoPppoe,
  TipoOperacionPppoe,
} from '../../domain/enums/pppoe-operacion.enum';
import {
  OperacionPppoeEnCursoError,
  OperacionPppoeEstadoInvalidoError,
  OperacionPppoeIdempotenciaError,
  OperacionPppoeNoEncontradaError,
  ReautenticacionOperadorInvalidaError,
} from '../../domain/errors/pppoe-operacion.errors';
import { PppoeOperacionQueryPort } from '../../domain/ports/pppoe-operacion-query.port';
import { CrearPppoeOperacionInput } from '../../public/pppoe-operacion.facade.port';
import { PppoeOperacionRepositoryFake } from '../../test/fakes/pppoe-operacion-repository.fake';
import { OperadorReautenticacionPort } from '../ports/operador-reautenticacion.port';
import { ActualizarPasoPppoeOperacionUseCase } from '../use-cases/actualizar-paso-pppoe-operacion.use-case';
import { AutorizarPppoeOperacionUseCase } from '../use-cases/autorizar-pppoe-operacion.use-case';
import { BuscarAgregadoPppoeOperacionUseCase } from '../use-cases/buscar-agregado-pppoe-operacion.use-case';
import { BuscarPppoeOperacionUseCase } from '../use-cases/buscar-pppoe-operacion.use-case';
import { CancelarPppoeOperacionUseCase } from '../use-cases/cancelar-pppoe-operacion.use-case';
import { CrearPppoeOperacionUseCase } from '../use-cases/crear-pppoe-operacion.use-case';
import { CrearReintentoPppoeOperacionUseCase } from '../use-cases/crear-reintento-pppoe-operacion.use-case';
import { FinalizarPppoeOperacionUseCase } from '../use-cases/finalizar-pppoe-operacion.use-case';
import { IniciarPppoeOperacionUseCase } from '../use-cases/iniciar-pppoe-operacion.use-case';
import { ListarPppoeOperacionesUseCase } from '../use-cases/listar-pppoe-operaciones.use-case';
import { ObtenerDetallePppoeOperacionUseCase } from '../use-cases/obtener-detalle-pppoe-operacion.use-case';

import { PppoeOperacionFacade } from './pppoe-operacion.facade';

const PASSWORD_VALIDA = 'correcta';

const reautenticacion: OperadorReautenticacionPort = {
  validar: async ({ password }) => password === PASSWORD_VALIDA,
};

const crearSecret: CrearPppoeOperacionInput = {
  empresaId: 1,
  cuentaPppoeId: 10,
  mikrotikRouterId: 3,
  perfilHomologacionId: 4,
  codigoPerfilSnapshot: 'PLAN-10M',
  instalacionId: 20,
  claveIdempotencia: 'crear-10-1',
  tipo: TipoOperacionPppoe.CREAR_SECRET,
  origen: OrigenOperacionPppoe.OPERADOR,
  iniciadoPorId: 7,
  usuarioPppoeSnapshot: 'cliente.prueba',
  routerHostSnapshot: '10.0.0.1',
  routerPuertoSnapshot: 22,
};

const suspender: CrearPppoeOperacionInput = {
  ...crearSecret,
  perfilHomologacionId: null,
  codigoPerfilSnapshot: null,
  instalacionId: null,
  claveIdempotencia: 'suspender-10-1',
  tipo: TipoOperacionPppoe.SUSPENDER_SERVICIO,
  origen: OrigenOperacionPppoe.SISTEMA,
};

function armar() {
  const repo = new PppoeOperacionRepositoryFake();
  const reloj = new RelojFijo('2026-11-25T15:00:00Z');
  const query = {} as PppoeOperacionQueryPort;
  const fachada = new PppoeOperacionFacade(
    new CrearPppoeOperacionUseCase(repo, reloj),
    new AutorizarPppoeOperacionUseCase(repo, reautenticacion, reloj),
    new IniciarPppoeOperacionUseCase(repo, reloj),
    new ActualizarPasoPppoeOperacionUseCase(repo, reloj),
    new FinalizarPppoeOperacionUseCase(repo, reloj),
    new CancelarPppoeOperacionUseCase(repo, reloj),
    new CrearReintentoPppoeOperacionUseCase(repo, reloj),
    new ListarPppoeOperacionesUseCase(query),
    new ObtenerDetallePppoeOperacionUseCase(query),
    new BuscarPppoeOperacionUseCase(repo),
    new BuscarAgregadoPppoeOperacionUseCase(repo),
  );
  return { fachada, repo, reloj };
}

describe('PppoeOperacionFacade', () => {
  describe('crear', () => {
    it('crea la operación PENDIENTE con su plan de pasos', async () => {
      const { fachada } = armar();

      const r = await fachada.crear(suspender);

      expect(r.creada).toBe(true);
      expect(r.operacion.id).toBe(1);
      expect(r.operacion.estaPendiente).toBe(true);
      expect(r.operacion.requiereReautenticacion).toBe(false);
      expect(r.pasos.length).toBeGreaterThan(0);
      expect(r.pasos.every((p) => p.estaPendiente)).toBe(true);
      expect(r.pasos.map((p) => p.orden)).toEqual(r.pasos.map((_, i) => i + 1));
    });

    it('CREAR_SECRET pide reautenticación por omisión', async () => {
      const { fachada } = armar();

      const r = await fachada.crear(crearSecret);

      expect(r.operacion.requiereReautenticacion).toBe(true);
    });

    it('repetir la clave devuelve la misma operación sin crear otra', async () => {
      const { fachada } = armar();
      await fachada.crear(suspender);

      const r = await fachada.crear(suspender);

      expect(r.creada).toBe(false);
      expect(r.operacion.id).toBe(1);
    });

    it('la misma clave para otra cuenta es un conflicto de idempotencia', async () => {
      const { fachada } = armar();
      await fachada.crear(suspender);

      await expect(
        fachada.crear({ ...suspender, cuentaPppoeId: 11 }),
      ).rejects.toBeInstanceOf(OperacionPppoeIdempotenciaError);
    });

    it('no abre otra operación sobre una cuenta con una en curso', async () => {
      const { fachada } = armar();
      await fachada.crear(suspender);

      await expect(
        fachada.crear({ ...suspender, claveIdempotencia: 'otra' }),
      ).rejects.toBeInstanceOf(OperacionPppoeEnCursoError);
    });
  });

  describe('autorizar', () => {
    it('contraseña incorrecta: 403 y queda registrada la reautenticación fallida', async () => {
      const { fachada, repo } = armar();
      await fachada.crear(crearSecret);

      await expect(
        fachada.autorizar({
          empresaId: 1,
          operacionId: 1,
          operadorId: 7,
          password: 'mala',
        }),
      ).rejects.toBeInstanceOf(ReautenticacionOperadorInvalidaError);

      const guardada = await repo.findById({ empresaId: 1, operacionId: 1 });
      expect(guardada!.estaPendiente()).toBe(true);
      expect(guardada!.toPrimitives().reautenticacionExitosa).toBe(false);
    });

    it('contraseña correcta: AUTORIZADA; repetir no vuelve a validar', async () => {
      const { fachada } = armar();
      await fachada.crear(crearSecret);
      const input = {
        empresaId: 1,
        operacionId: 1,
        operadorId: 7,
        password: PASSWORD_VALIDA,
      };

      const r = await fachada.autorizar(input);
      const otra = await fachada.autorizar({ ...input, password: 'mala' });

      expect(r.estaAutorizada).toBe(true);
      expect(otra.estaAutorizada).toBe(true);
    });

    it('una operación inexistente es 404', async () => {
      const { fachada } = armar();

      await expect(
        fachada.autorizar({
          empresaId: 1,
          operacionId: 99,
          operadorId: 7,
          password: PASSWORD_VALIDA,
        }),
      ).rejects.toBeInstanceOf(OperacionPppoeNoEncontradaError);
    });
  });

  describe('iniciar', () => {
    it('una operación protegida no inicia sin autorizar', async () => {
      const { fachada } = armar();
      await fachada.crear(crearSecret);

      await expect(
        fachada.iniciar({ empresaId: 1, operacionId: 1 }),
      ).rejects.toBeInstanceOf(OperacionPppoeEstadoInvalidoError);
    });

    it('reclama la operación y la deja EJECUTANDO con la hora del reloj', async () => {
      const { fachada, reloj } = armar();
      await fachada.crear(suspender);
      reloj.establecer('2026-11-25T15:05:00Z');

      const r = await fachada.iniciar({ empresaId: 1, operacionId: 1 });

      expect(r.operacion.estaEjecutando).toBe(true);
      expect(r.operacion.iniciadoEn).toEqual(new Date('2026-11-25T15:05:00Z'));
    });

    it('si otro proceso la tomó primero, responde en curso', async () => {
      const { fachada, repo } = armar();
      await fachada.crear(suspender);
      repo.reclamoFalla = true;

      await expect(
        fachada.iniciar({ empresaId: 1, operacionId: 1 }),
      ).rejects.toBeInstanceOf(OperacionPppoeEnCursoError);
    });
  });

  describe('pasos y finalización', () => {
    async function enEjecucion() {
      const ctx = armar();
      await ctx.fachada.crear(suspender);
      const r = await ctx.fachada.iniciar({ empresaId: 1, operacionId: 1 });
      return { ...ctx, pasos: r.pasos };
    }

    it('no se puede dar por EXITOSA con pasos pendientes', async () => {
      const { fachada } = await enEjecucion();

      await expect(
        fachada.finalizar({
          empresaId: 1,
          operacionId: 1,
          estadoFinal: EstadoOperacionPppoe.EXITOSA,
        }),
      ).rejects.toBeInstanceOf(OperacionPppoeEstadoInvalidoError);
    });

    it('con todos los pasos exitosos termina EXITOSA', async () => {
      const { fachada, pasos, reloj } = await enEjecucion();

      for (const paso of pasos) {
        reloj.avanzar({ minutos: 1 });
        await fachada.actualizarPaso({
          empresaId: 1,
          operacionId: 1,
          selector: { orden: paso.orden },
          accion: 'INICIAR',
        });
        reloj.avanzar({ minutos: 1 });
        await fachada.actualizarPaso({
          empresaId: 1,
          operacionId: 1,
          selector: { orden: paso.orden },
          accion: 'MARCAR_EXITOSO',
        });
      }

      const r = await fachada.finalizar({
        empresaId: 1,
        operacionId: 1,
        estadoFinal: EstadoOperacionPppoe.EXITOSA,
      });

      expect(r.operacion.estado).toBe(EstadoOperacionPppoe.EXITOSA);
      expect(r.operacion.esTerminal).toBe(true);
      expect(r.pasos.every((p) => p.estado === EstadoPasoPppoe.EXITOSO)).toBe(
        true,
      );
    });

    it('un paso fallido permite cerrar FALLIDA y crear un reintento', async () => {
      const { fachada, pasos, reloj } = await enEjecucion();
      const primero = { orden: pasos[0].orden };

      await fachada.actualizarPaso({
        empresaId: 1,
        operacionId: 1,
        selector: primero,
        accion: 'INICIAR',
      });
      reloj.avanzar({ minutos: 1 });
      await fachada.actualizarPaso({
        empresaId: 1,
        operacionId: 1,
        selector: primero,
        accion: 'MARCAR_FALLIDO',
        errorCodigo: 'SSH_TIMEOUT',
        errorMensaje: 'El router no respondió.',
      });
      const fallida = await fachada.finalizar({
        empresaId: 1,
        operacionId: 1,
        estadoFinal: EstadoOperacionPppoe.FALLIDA,
        errorCodigo: 'SSH_TIMEOUT',
        errorMensaje: 'El router no respondió.',
      });
      expect(fallida.operacion.puedeReintentarse).toBe(true);

      reloj.avanzar({ minutos: 1 });
      const reintento = await fachada.crearReintento({
        empresaId: 1,
        operacionId: 1,
        claveIdempotencia: 'suspender-10-2',
        iniciadoPorId: null,
        mikrotikRouterId: 3,
        routerHostSnapshot: '10.0.0.1',
        routerPuertoSnapshot: 22,
      });

      expect(reintento.creada).toBe(true);
      expect(reintento.operacion.reintentoDeId).toBe(1);
      expect(reintento.operacion.numeroIntento).toBe(2);
      expect(reintento.operacion.esReintento).toBe(true);
    });
  });

  describe('cancelar', () => {
    it('cancela una operación que aún no se ejecuta', async () => {
      const { fachada } = armar();
      await fachada.crear(suspender);

      const r = await fachada.cancelar({
        empresaId: 1,
        operacionId: 1,
        motivo: 'Pago registrado.',
      });

      expect(r.operacion.estado).toBe(EstadoOperacionPppoe.CANCELADA);
    });

    it('no cancela una operación en ejecución', async () => {
      const { fachada } = armar();
      await fachada.crear(suspender);
      await fachada.iniciar({ empresaId: 1, operacionId: 1 });

      await expect(
        fachada.cancelar({ empresaId: 1, operacionId: 1, motivo: 'x' }),
      ).rejects.toBeInstanceOf(OperacionPppoeEstadoInvalidoError);
    });
  });
});
