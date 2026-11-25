import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.types';

import {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from '../enums/pppoe-operacion.enum';
import {
  OperacionPppoeDatosInvalidosError,
  OperacionPppoeEstadoInvalidoError,
} from '../errors/pppoe-operacion.errors';
import { CrearPppoeOperacionProps } from '../props/pppoe-operacion.props';

import { PppoeOperacionEntity } from './pppoe-operacion.entity';

const T0 = new Date('2026-11-25T15:00:00Z');
const T1 = new Date('2026-11-25T15:01:00Z');
const T2 = new Date('2026-11-25T15:02:00Z');
const T3 = new Date('2026-11-25T15:02:30Z');

const alta: CrearPppoeOperacionProps = {
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

const persistida = (
  extra: Partial<CrearPppoeOperacionProps> = {},
): PppoeOperacionEntity =>
  PppoeOperacionEntity.hydrate({
    ...PppoeOperacionEntity.create({ ...alta, ...extra }, T0).toPrimitives(),
    id: 100,
  });

const ejecutando = () => {
  const o = persistida();
  o.iniciar({ fecha: T1 });
  return o;
};

describe('PppoeOperacionEntity', () => {
  describe('create', () => {
    it('nace PENDIENTE, primer intento y por SSH', () => {
      const o = PppoeOperacionEntity.create(alta, T0);

      expect(o.estado).toBe(EstadoOperacionPppoe.PENDIENTE);
      expect(o.numeroIntento).toBe(1);
      expect(o.canal).toBe(CanalOperacionPppoe.SSH);
      expect(o.esReintento()).toBe(false);
      expect(o.toPrimitives().creadoEn).toEqual(T0);
    });

    it('CREAR_SECRET exige el perfil homologado', () => {
      expect(() =>
        PppoeOperacionEntity.create(
          { ...alta, perfilHomologacionId: null, codigoPerfilSnapshot: null },
          T0,
        ),
      ).toThrow(OperacionPppoeDatosInvalidosError);
    });

    it('una operación de OPERADOR exige quién la inició', () => {
      expect(() =>
        PppoeOperacionEntity.create({ ...alta, iniciadoPorId: null }, T0),
      ).toThrow(OperacionPppoeDatosInvalidosError);
    });

    it('no puede ser de instalación y de desinstalación a la vez', () => {
      expect(() =>
        PppoeOperacionEntity.create({ ...alta, desinstalacionId: 30 }, T0),
      ).toThrow(OperacionPppoeDatosInvalidosError);
    });

    it('rechaza un puerto de router fuera de rango', () => {
      expect(() =>
        PppoeOperacionEntity.create({ ...alta, routerPuertoSnapshot: 0 }, T0),
      ).toThrow(OperacionPppoeDatosInvalidosError);
    });
  });

  describe('sin reautenticación', () => {
    it('PENDIENTE → EJECUTANDO → EXITOSA con duración', () => {
      const o = ejecutando();
      expect(o.estaEjecutando()).toBe(true);
      expect(o.estaEnCurso()).toBe(true);

      o.marcarExitosa({ resultado: { secretCreado: true }, fecha: T2 });

      expect(o.estado).toBe(EstadoOperacionPppoe.EXITOSA);
      expect(o.esTerminal()).toBe(true);
      expect(o.duracionMs).toBe(60_000);
      expect(o.toPrimitives().resultado).toEqual({ secretCreado: true });
    });

    it('no se puede autorizar si no pide reautenticación', () => {
      expect(() =>
        persistida().autorizar({ reautenticadoPorId: 7, fecha: T1 }),
      ).toThrow(OperacionPppoeEstadoInvalidoError);
    });

    it('EJECUTANDO → FALLIDA o PARCIAL exige código y mensaje', () => {
      const fallida = ejecutando();
      fallida.marcarFallida({
        errorCodigo: 'ssh_auth_rejected',
        errorMensaje: 'El router rechazó las credenciales.',
        fecha: T2,
      });
      expect(fallida.estado).toBe(EstadoOperacionPppoe.FALLIDA);
      expect(fallida.toPrimitives().errorCodigo).toBe('SSH_AUTH_REJECTED');
      expect(fallida.puedeReintentarse()).toBe(true);

      expect(() =>
        ejecutando().marcarParcial({
          errorCodigo: '',
          errorMensaje: 'x',
          fecha: T2,
        }),
      ).toThrow(OperacionPppoeDatosInvalidosError);
    });

    it('no termina antes de haber iniciado', () => {
      expect(() => ejecutando().marcarExitosa({ fecha: T0 })).toThrow(
        OperacionPppoeDatosInvalidosError,
      );
      expect(() => persistida().marcarExitosa({ fecha: T2 })).toThrow(
        OperacionPppoeEstadoInvalidoError,
      );
    });

    it('rechaza un resultado con claves sensibles', () => {
      expect(() =>
        ejecutando().marcarExitosa({
          resultado: { detalle: { password: 'x' } },
          fecha: T2,
        }),
      ).toThrow(OperacionPppoeDatosInvalidosError);
      expect(() =>
        ejecutando().marcarExitosa({
          resultado: { Contraseña: 'x' },
          fecha: T2,
        }),
      ).toThrow(OperacionPppoeDatosInvalidosError);
    });
  });

  describe('con reautenticación', () => {
    const protegida = () => persistida({ requiereReautenticacion: true });

    it('no puede iniciar sin autorizar', () => {
      expect(() => protegida().iniciar({ fecha: T1 })).toThrow(
        OperacionPppoeEstadoInvalidoError,
      );
    });

    it('PENDIENTE → AUTORIZADA → EJECUTANDO', () => {
      const o = protegida();

      o.autorizar({ reautenticadoPorId: 7, fecha: T1 });
      expect(o.estaAutorizada()).toBe(true);

      o.iniciar({ fecha: T2 });
      expect(o.estaEjecutando()).toBe(true);
    });

    it('una reautenticación fallida deja la operación PENDIENTE', () => {
      const o = protegida();

      o.registrarReautenticacionFallida({ reautenticadoPorId: 7, fecha: T1 });

      expect(o.estaPendiente()).toBe(true);
      expect(o.toPrimitives().reautenticacionExitosa).toBe(false);
    });

    it('no inicia antes de la autorización', () => {
      const o = protegida();
      o.autorizar({ reautenticadoPorId: 7, fecha: T2 });

      expect(() => o.iniciar({ fecha: T1 })).toThrow(
        OperacionPppoeDatosInvalidosError,
      );
    });
  });

  describe('cancelar', () => {
    it('PENDIENTE → CANCELADA con motivo', () => {
      const o = persistida();

      o.cancelar({ motivo: 'Cliente desistió.', fecha: T1 });

      expect(o.fueCancelada()).toBe(true);
      expect(o.puedeReintentarse()).toBe(false);
    });

    it('exige motivo y no cancela una operación en ejecución', () => {
      expect(() => persistida().cancelar({ motivo: '  ', fecha: T1 })).toThrow(
        OperacionPppoeDatosInvalidosError,
      );
      expect(() => ejecutando().cancelar({ motivo: 'x', fecha: T2 })).toThrow(
        OperacionPppoeEstadoInvalidoError,
      );
    });
  });

  describe('crearReintento', () => {
    const fallida = () => {
      const o = ejecutando();
      o.marcarFallida({ errorCodigo: 'X', errorMensaje: 'y', fecha: T2 });
      return o;
    };

    const reintento = {
      fecha: T3,
      claveIdempotencia: 'crear-10-2',
      iniciadoPorId: 8,
      mikrotikRouterId: 3,
      routerHostSnapshot: '10.0.0.2',
      routerPuertoSnapshot: 2222,
    };

    it('crea un segundo intento PENDIENTE ligado a la operación raíz', () => {
      const r = fallida().crearReintento(reintento);

      expect(r.estaPendiente()).toBe(true);
      expect(r.id).toBeNull();
      expect(r.reintentoDeId).toBe(100);
      expect(r.numeroIntento).toBe(2);
      expect(r.iniciadoPorId).toBe(8);
      expect(r.esReintento()).toBe(true);
      expect(r.toPrimitives().routerHostSnapshot).toBe('10.0.0.2');
      expect(r.perfilHomologacionId).toBe(4);
    });

    it('solo reintenta operaciones FALLIDA o PARCIAL', () => {
      expect(() => ejecutando().crearReintento(reintento)).toThrow(
        OperacionPppoeEstadoInvalidoError,
      );
    });
  });

  describe('hydrate', () => {
    it('rechaza estados incoherentes con sus datos', () => {
      const base = { ...persistida().toPrimitives() };

      expect(() =>
        PppoeOperacionEntity.hydrate({
          ...base,
          estado: EstadoOperacionPppoe.EJECUTANDO,
        }),
      ).toThrow(OperacionPppoeDatosInvalidosError);
      expect(() =>
        PppoeOperacionEntity.hydrate({ ...base, reintentoDeId: 100 }),
      ).toThrow(OperacionPppoeDatosInvalidosError);
      expect(() =>
        PppoeOperacionEntity.hydrate({
          ...base,
          actualizadoEn: new Date('2026-01-01T00:00:00Z'),
        }),
      ).toThrow(OperacionPppoeDatosInvalidosError);
    });

    it('devuelve copias, no referencias internas', () => {
      const o = ejecutando();

      o.toPrimitives().iniciadoEn!.setFullYear(2000);

      expect(o.iniciadoEn).toEqual(T1);
    });
  });
});
