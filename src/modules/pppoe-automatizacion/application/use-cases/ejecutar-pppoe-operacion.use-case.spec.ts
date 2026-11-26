import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import {
  EfectoRemotoMikrotik,
  FaseFalloMikrotikSsh,
} from 'src/modules/mikrotik-ssh/public/mikrotik-ssh.types';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import {
  EstadoOperacionPppoe,
  EstadoPasoPppoe,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

import {
  OperacionPppoeRequiereRecuperacionError,
  PppoeOperacionStepError,
} from '../../domain/errors/pppoe-automatizacion.errors';
import { PppoeClienteCuentaFacadeFake } from '../../test/fakes/pppoe-cliente-cuenta-facade.fake';
import { PppoeOperacionAuditoriaFake } from '../../test/fakes/pppoe-operacion-auditoria.fake';
import { PppoeOperacionFacadeFake } from '../../test/fakes/pppoe-operacion-facade.fake';
import {
  conEstadoPaso,
  cuenta,
  operacion,
  paso,
} from '../../test/fakes/pppoe-read-models.fake';
import { PppoeOperacionStepRunnerService } from '../services/pppoe-operacion-step-runner.service';
import { SincronizacionLocalPppoeService } from '../services/sincronizacion-local-pppoe.service';
import { EjecutarPppoeOperacionUseCase } from './ejecutar-pppoe-operacion.use-case';

type Puertos = ConstructorParameters<typeof EjecutarPppoeOperacionUseCase>;

const AHORA = new Date('2026-11-25T15:05:00.000Z');
const { PENDIENTE } = EstadoPasoPppoe;

describe('EjecutarPppoeOperacionUseCase', () => {
  let operaciones: PppoeOperacionFacadeFake;
  let cuentas: PppoeClienteCuentaFacadeFake;
  let auditoria: PppoeOperacionAuditoriaFake;
  let transicionesAcceso: string[];
  let estadosCliente: string[];
  let falloAcceso: boolean;
  let contextoFalla: boolean;
  /** Lo que hace el ejecutor técnico (el "router"). */
  let router: jest.Mock;
  let motor: EjecutarPppoeOperacionUseCase;

  const ejecutar = () => motor.execute({ empresaId: 1, operacionId: 10 });

  const preparar = (
    tipo: TipoOperacionPppoe,
    estadoCuenta: EstadoCuentaPppoe,
    datos: Parameters<typeof operacion>[0] = {},
  ) => {
    operaciones.agregado = {
      operacion: operacion({
        tipo,
        estado: EstadoOperacionPppoe.AUTORIZADA,
        ...datos,
      }),
      pasos: [
        paso(1, TipoPasoPppoe.CONECTAR_ROUTER, PENDIENTE),
        paso(2, TipoPasoPppoe.DESHABILITAR_SECRET, PENDIENTE),
      ],
    };
    cuentas.cuenta = cuenta({
      estado: estadoCuenta,
      secretCreadoEn: AHORA,
      activadoEn: AHORA,
    });
  };

  /** Simula que el ejecutor dejó el paso 2 FALLIDO y lanzó su error. */
  const falloEnPaso2 = (efectoRemoto: EfectoRemotoMikrotik) => {
    router.mockImplementation(() => {
      const agregado = operaciones.agregado!;
      operaciones.agregado = {
        ...agregado,
        pasos: agregado.pasos.map((p) =>
          p.orden === 2
            ? conEstadoPaso({ ...p, estado: EstadoPasoPppoe.FALLIDO })
            : p,
        ),
      };
      return Promise.reject(
        new PppoeOperacionStepError({
          errorCodigo: 'TIMEOUT_COMANDO',
          errorMensaje: 'El router no respondió a tiempo.',
          efectoRemoto,
          reintentable: true,
          fase: FaseFalloMikrotikSsh.EJECUCION,
        }),
      );
    });
  };

  beforeEach(() => {
    operaciones = new PppoeOperacionFacadeFake();
    cuentas = new PppoeClienteCuentaFacadeFake();
    auditoria = new PppoeOperacionAuditoriaFake();
    transicionesAcceso = [];
    estadosCliente = [];
    falloAcceso = false;
    contextoFalla = false;
    router = jest.fn().mockResolvedValue({ confirmado: true });

    const accesos = {
      buscarPorId: () =>
        Promise.resolve({ id: 30, empresaId: 1, clienteId: 50 }),
      cambiarEstado: (i: { transicion: string }) => {
        if (falloAcceso) return Promise.reject(new Error('BD caída'));
        transicionesAcceso.push(i.transicion);
        return Promise.resolve({ id: 30, empresaId: 1, clienteId: 50 });
      },
    } as unknown as Puertos[10];
    const cliente = {
      sincronizar: (p: { estado: string }) => {
        estadosCliente.push(p.estado);
        return Promise.resolve();
      },
    };
    const contexto = {
      resolve: (op: unknown) =>
        contextoFalla
          ? Promise.reject(new Error('router sin credenciales'))
          : Promise.resolve({ operacion: op, cuenta: cuentas.cuenta }),
    } as unknown as Puertos[2];
    const ejecutor = { execute: router } as unknown as Puertos[3];

    motor = new EjecutarPppoeOperacionUseCase(
      new RelojFijo(AHORA),
      operaciones,
      contexto,
      ejecutor,
      new PppoeOperacionStepRunnerService(operaciones),
      ejecutor as unknown as Puertos[5],
      ejecutor as unknown as Puertos[6],
      ejecutor as unknown as Puertos[7],
      auditoria,
      cuentas,
      accesos,
      new SincronizacionLocalPppoeService(
        cuentas,
        accesos,
        cliente as unknown as ConstructorParameters<
          typeof SincronizacionLocalPppoeService
        >[2],
      ),
    );
  });

  it('suspensión exitosa: sincroniza cuenta, acceso y cliente y termina EXITOSA', async () => {
    preparar(TipoOperacionPppoe.SUSPENDER_SERVICIO, EstadoCuentaPppoe.ACTIVA);

    const r = await ejecutar();

    expect(router).toHaveBeenCalledTimes(1);
    expect(r).toMatchObject({
      estadoOperacion: EstadoOperacionPppoe.EXITOSA,
      estadoCuenta: EstadoCuentaPppoe.SUSPENDIDA,
      errorCodigo: null,
    });
    expect(cuentas.transiciones).toEqual(['MARCAR_SUSPENDIDA']);
    expect(transicionesAcceso).toEqual(['SUSPENDER']);
    expect(estadosCliente).toEqual(['SUSPENDIDO']);
    expect(operaciones.finalizaciones[0]).toMatchObject({
      resultado: { confirmado: true },
    });
    expect(auditoria.nombres).toEqual(['INICIADA', 'FINALIZADA']);
  });

  it('creación: el acceso pasa a CONFIGURANDO antes del router y el cliente no cambia', async () => {
    preparar(
      TipoOperacionPppoe.CREAR_SECRET,
      EstadoCuentaPppoe.PENDIENTE_ACTIVACION,
    );
    router.mockImplementation(() => {
      expect(transicionesAcceso).toEqual(['INICIAR_CONFIGURACION']);
      expect(cuentas.cuenta!.estado).toBe(EstadoCuentaPppoe.EN_INSTALACION);
      return Promise.resolve({});
    });

    const r = await ejecutar();

    expect(cuentas.transiciones).toEqual([
      'INICIAR_INSTALACION',
      'MARCAR_SECRET_CREADO',
    ]);
    expect(r.estadoCuenta).toBe(EstadoCuentaPppoe.PENDIENTE_ACTIVACION);
    expect(transicionesAcceso).toEqual(['INICIAR_CONFIGURACION']);
    expect(estadosCliente).toEqual([]);
  });

  it('si el router confirmó pero lo local falla, queda EJECUTANDO para la recuperación', async () => {
    preparar(TipoOperacionPppoe.SUSPENDER_SERVICIO, EstadoCuentaPppoe.ACTIVA);
    falloAcceso = true;

    await expect(ejecutar()).rejects.toBeInstanceOf(
      OperacionPppoeRequiereRecuperacionError,
    );
    expect(operaciones.finalizaciones).toHaveLength(0);
  });

  it('fallo con posible cambio en el router: PARCIAL y la cuenta queda en ERROR', async () => {
    preparar(TipoOperacionPppoe.SUSPENDER_SERVICIO, EstadoCuentaPppoe.ACTIVA);
    falloEnPaso2(EfectoRemotoMikrotik.POSIBLE);

    const r = await ejecutar();

    expect(r).toMatchObject({
      estadoOperacion: EstadoOperacionPppoe.PARCIAL,
      estadoCuenta: EstadoCuentaPppoe.ERROR,
      errorCodigo: 'TIMEOUT_COMANDO',
      reintentable: true,
    });
    // El paso ya estaba FALLIDO: no se marca otro.
    expect(operaciones.pasos).toHaveLength(0);
  });

  it('fallo sin efecto remoto: FALLIDA aunque el paso tenga efecto remoto', async () => {
    preparar(TipoOperacionPppoe.SUSPENDER_SERVICIO, EstadoCuentaPppoe.ACTIVA);
    falloEnPaso2(EfectoRemotoMikrotik.NO_INICIADO);

    const r = await ejecutar();

    expect(r.estadoOperacion).toBe(EstadoOperacionPppoe.FALLIDA);
  });

  it('fallo antes del router: marca el primer paso FALLIDO y no toca la cuenta', async () => {
    preparar(TipoOperacionPppoe.SUSPENDER_SERVICIO, EstadoCuentaPppoe.ACTIVA);
    contextoFalla = true;

    const r = await ejecutar();

    expect(router).not.toHaveBeenCalled();
    expect(operaciones.acciones).toEqual(['INICIAR', 'MARCAR_FALLIDO']);
    expect(operaciones.pasos[0].selector).toEqual({ orden: 1 });
    expect(r).toMatchObject({
      estadoOperacion: EstadoOperacionPppoe.FALLIDA,
      errorCodigo: 'PPPOE_CONTEXTO_EJECUCION_INVALIDO',
      estadoCuenta: EstadoCuentaPppoe.ACTIVA,
    });
    expect(cuentas.errores).toHaveLength(0);
  });

  it('una eliminación vinculada solo a una instalación no llega al router', async () => {
    preparar(TipoOperacionPppoe.ELIMINAR_SECRET, EstadoCuentaPppoe.ACTIVA, {
      instalacionId: 5,
      desinstalacionId: null,
    });

    const r = await ejecutar();

    expect(router).not.toHaveBeenCalled();
    expect(r.estadoOperacion).toBe(EstadoOperacionPppoe.FALLIDA);
    expect(cuentas.transiciones).toEqual([]);
  });

  it('no continúa una operación con pasos ya procesados', async () => {
    preparar(TipoOperacionPppoe.SUSPENDER_SERVICIO, EstadoCuentaPppoe.ACTIVA);
    operaciones.agregado!.pasos[0] = paso(
      1,
      TipoPasoPppoe.CONECTAR_ROUTER,
      EstadoPasoPppoe.EXITOSO,
    );

    await expect(ejecutar()).rejects.toBeInstanceOf(
      OperacionPppoeRequiereRecuperacionError,
    );
    expect(router).not.toHaveBeenCalled();
  });
});
