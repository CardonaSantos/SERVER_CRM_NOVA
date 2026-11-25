import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import {
  EstadoOperacionPppoe,
  EstadoPasoPppoe,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

import {
  ProvisionamientoPppoeDatosInvalidosError,
  ProvisionamientoPppoeEstadoInvalidoError,
} from '../../domain/errors/pppoe-automatizacion.errors';
import { PppoeClienteCuentaFacadeFake } from '../../test/fakes/pppoe-cliente-cuenta-facade.fake';
import { PppoeOperacionAuditoriaFake } from '../../test/fakes/pppoe-operacion-auditoria.fake';
import { PppoeOperacionFacadeFake } from '../../test/fakes/pppoe-operacion-facade.fake';
import {
  INICIO,
  cuenta,
  operacion,
  paso,
} from '../../test/fakes/pppoe-read-models.fake';
import { RecuperarPppoeOperacionInterrumpidaUseCase } from './recuperar-pppoe-operacion-interrumpida.use-case';

const AHORA = new Date('2026-11-25T15:10:00.000Z');
const { EXITOSO, FALLIDO, EJECUTANDO, PENDIENTE, OMITIDO } = EstadoPasoPppoe;

describe('RecuperarPppoeOperacionInterrumpidaUseCase', () => {
  let operaciones: PppoeOperacionFacadeFake;
  let cuentas: PppoeClienteCuentaFacadeFake;
  let auditoria: PppoeOperacionAuditoriaFake;
  let recuperar: RecuperarPppoeOperacionInterrumpidaUseCase;

  const ejecutar = () =>
    recuperar.execute({
      empresaId: 1,
      operacionId: 10,
      confirmarAbandono: true,
    });

  beforeEach(() => {
    operaciones = new PppoeOperacionFacadeFake();
    cuentas = new PppoeClienteCuentaFacadeFake();
    auditoria = new PppoeOperacionAuditoriaFake();
    recuperar = new RecuperarPppoeOperacionInterrumpidaUseCase(
      new RelojFijo(AHORA),
      operaciones,
      auditoria,
      cuentas,
    );
  });

  describe('pasos remotos completos (solo faltó sincronizar)', () => {
    it('termina EXITOSA y aplica a la cuenta el resultado confirmado', async () => {
      operaciones.agregado = {
        operacion: operacion({ tipo: TipoOperacionPppoe.SUSPENDER_SERVICIO }),
        pasos: [
          paso(1, TipoPasoPppoe.CONECTAR_ROUTER, EXITOSO),
          paso(2, TipoPasoPppoe.DESHABILITAR_SECRET, EXITOSO),
          paso(3, TipoPasoPppoe.REMOVER_SESION_ACTIVA, OMITIDO),
        ],
      };
      cuentas.cuenta = cuenta({ estado: EstadoCuentaPppoe.ACTIVA });

      const r = await ejecutar();

      expect(r.estadoOperacion).toBe(EstadoOperacionPppoe.EXITOSA);
      expect(r.estadoCuenta).toBe(EstadoCuentaPppoe.SUSPENDIDA);
      expect(cuentas.transiciones).toEqual(['MARCAR_SUSPENDIDA']);
      expect(operaciones.finalizaciones[0]).toMatchObject({ fecha: AHORA });
      // No se repite ningún comando: los pasos no se tocan.
      expect(operaciones.pasos).toHaveLength(0);
      expect(auditoria.nombres).toEqual(['FINALIZADA', 'RECUPERADA']);
      expect(auditoria.eventos[1].params).toMatchObject({
        recuperacion: 'SINCRONIZACION_LOCAL_COMPLETADA',
      });
    });

    it('no repite la transición si la cuenta ya quedó en el estado final', async () => {
      operaciones.agregado = {
        operacion: operacion({ tipo: TipoOperacionPppoe.SUSPENDER_SERVICIO }),
        pasos: [paso(1, TipoPasoPppoe.DESHABILITAR_SECRET, EXITOSO)],
      };
      cuentas.cuenta = cuenta({ estado: EstadoCuentaPppoe.SUSPENDIDA });

      await ejecutar();

      expect(cuentas.transiciones).toEqual([]);
    });

    it('rechaza reconciliar si la cuenta está en un estado incompatible', async () => {
      operaciones.agregado = {
        operacion: operacion({ tipo: TipoOperacionPppoe.ACTIVAR_SECRET }),
        pasos: [paso(1, TipoPasoPppoe.HABILITAR_SECRET, EXITOSO)],
      };
      cuentas.cuenta = cuenta({ estado: EstadoCuentaPppoe.ELIMINADA });

      await expect(ejecutar()).rejects.toBeInstanceOf(
        ProvisionamientoPppoeEstadoInvalidoError,
      );
      expect(operaciones.finalizaciones).toHaveLength(0);
    });
  });

  describe('ejecución incompleta', () => {
    it('sin efecto remoto posible: cierra el paso en curso y queda FALLIDA', async () => {
      operaciones.agregado = {
        operacion: operacion(),
        pasos: [
          paso(1, TipoPasoPppoe.CONECTAR_ROUTER, EXITOSO),
          paso(2, TipoPasoPppoe.BUSCAR_SECRET, EJECUTANDO),
          paso(3, TipoPasoPppoe.DESHABILITAR_SECRET, PENDIENTE),
        ],
      };
      cuentas.cuenta = cuenta({ estado: EstadoCuentaPppoe.ACTIVA });

      const r = await ejecutar();

      expect(operaciones.pasos).toEqual([
        expect.objectContaining({
          accion: 'MARCAR_FALLIDO',
          selector: { pasoId: 102 },
          errorCodigo: 'PPPOE_OPERACION_INTERRUMPIDA',
        }),
      ]);
      expect(r.estadoOperacion).toBe(EstadoOperacionPppoe.FALLIDA);
      expect(r.reintentable).toBe(true);
      expect(r.errorCodigo).toBe('PPPOE_OPERACION_INTERRUMPIDA');
      expect(cuentas.errores).toHaveLength(1);
      expect(auditoria.eventos[1].params).toMatchObject({
        recuperacion: 'CERRADA_COMO_FALLIDA',
      });
    });

    it('con un paso que pudo cambiar el router: queda PARCIAL', async () => {
      operaciones.agregado = {
        operacion: operacion(),
        pasos: [
          paso(1, TipoPasoPppoe.CONECTAR_ROUTER, EXITOSO),
          paso(2, TipoPasoPppoe.DESHABILITAR_SECRET, EJECUTANDO),
        ],
      };
      cuentas.cuenta = cuenta({ estado: EstadoCuentaPppoe.ACTIVA });

      const r = await ejecutar();

      expect(r.estadoOperacion).toBe(EstadoOperacionPppoe.PARCIAL);
      expect(auditoria.eventos[1].params).toMatchObject({
        recuperacion: 'CERRADA_COMO_PARCIAL',
      });
    });

    it('si ningún paso empezó: inicia y falla el primero pendiente', async () => {
      operaciones.agregado = {
        operacion: operacion(),
        pasos: [
          paso(2, TipoPasoPppoe.BUSCAR_SECRET, PENDIENTE),
          paso(1, TipoPasoPppoe.CONECTAR_ROUTER, PENDIENTE),
        ],
      };
      cuentas.cuenta = cuenta({ estado: EstadoCuentaPppoe.ACTIVA });

      await ejecutar();

      expect(operaciones.acciones).toEqual(['INICIAR', 'MARCAR_FALLIDO']);
      expect(operaciones.pasos[0].selector).toEqual({ pasoId: 101 });
    });

    it('si ya hay un paso FALLIDO no agrega otro', async () => {
      operaciones.agregado = {
        operacion: operacion(),
        pasos: [paso(1, TipoPasoPppoe.CONECTAR_ROUTER, FALLIDO)],
      };
      cuentas.cuenta = cuenta({ estado: EstadoCuentaPppoe.ACTIVA });

      const r = await ejecutar();

      expect(operaciones.pasos).toHaveLength(0);
      expect(r.estadoOperacion).toBe(EstadoOperacionPppoe.FALLIDA);
    });
  });

  it('es idempotente: una operación terminada se devuelve sin cambios', async () => {
    operaciones.agregado = {
      operacion: operacion({ estado: EstadoOperacionPppoe.EXITOSA }),
      pasos: [],
    };
    cuentas.cuenta = cuenta({ estado: EstadoCuentaPppoe.SUSPENDIDA });

    const r = await ejecutar();

    expect(r.estadoOperacion).toBe(EstadoOperacionPppoe.EXITOSA);
    expect(operaciones.finalizaciones).toHaveLength(0);
    expect(auditoria.eventos).toHaveLength(0);
  });

  it('rechaza una operación que no está EJECUTANDO', async () => {
    operaciones.agregado = {
      operacion: operacion({ estado: EstadoOperacionPppoe.PENDIENTE }),
      pasos: [],
    };

    await expect(ejecutar()).rejects.toBeInstanceOf(
      ProvisionamientoPppoeEstadoInvalidoError,
    );
  });

  it('exige confirmar el abandono', async () => {
    await expect(
      recuperar.execute({
        empresaId: 1,
        operacionId: 10,
        confirmarAbandono: false as unknown as true,
      }),
    ).rejects.toBeInstanceOf(ProvisionamientoPppoeDatosInvalidosError);
  });

  it('no acepta una fecha anterior al inicio de la operación', async () => {
    operaciones.agregado = { operacion: operacion(), pasos: [] };

    await expect(
      recuperar.execute({
        empresaId: 1,
        operacionId: 10,
        confirmarAbandono: true,
        fecha: new Date(INICIO.getTime() - 1000),
      }),
    ).rejects.toBeInstanceOf(ProvisionamientoPppoeDatosInvalidosError);
  });
});
