import { EstadoTrackingTecnico } from '../enums/estado-tracking-tecnico.enum';
import {
  TrackingDatosInvalidosError,
  TrackingSesionEstadoInvalidoError,
} from '../errors/real-time-location.errors';
import { TecnicoTrackingSesionEntity } from './tecnico-tracking-sesion.entity';

const T0 = new Date('2026-11-25T14:00:00.000Z');
const T1 = new Date('2026-11-25T14:10:00.000Z');
const T2 = new Date('2026-11-25T14:20:00.000Z');

const nueva = () =>
  TecnicoTrackingSesionEntity.create({
    tecnicoId: 7,
    asistenciaId: 50,
    iniciadoEn: T0,
  });

/** Una sesión ya guardada (con id), que es la que admite transiciones. */
const guardada = (cambios: Record<string, unknown> = {}) =>
  TecnicoTrackingSesionEntity.hydrate({
    ...nueva().toPrimitives(),
    id: 1,
    ...cambios,
  });

describe('TecnicoTrackingSesionEntity', () => {
  describe('create', () => {
    it('nace ACTIVA con el instante recibido como inicio y primer heartbeat', () => {
      const sesion = nueva();

      expect(sesion.isActiva).toBe(true);
      expect(sesion.iniciadoEn).toEqual(T0);
      expect(sesion.ultimoHeartbeatEn).toEqual(T0);
      expect(sesion.finalizadoEn).toBeNull();
      expect(sesion.isPersisted).toBe(false);
    });

    it.each([0, -3, 1.5])('rechaza el técnico %p', (tecnicoId) => {
      expect(() =>
        TecnicoTrackingSesionEntity.create({
          tecnicoId,
          asistenciaId: 50,
          iniciadoEn: T0,
        }),
      ).toThrow(TrackingDatosInvalidosError);
    });

    it('rechaza una fecha de inicio inválida', () => {
      expect(() =>
        TecnicoTrackingSesionEntity.create({
          tecnicoId: 7,
          asistenciaId: 50,
          iniciadoEn: new Date('x'),
        }),
      ).toThrow(TrackingDatosInvalidosError);
    });
  });

  describe('registrarHeartbeat', () => {
    it('avanza el último heartbeat', () => {
      const sesion = guardada();

      sesion.registrarHeartbeat(T1);

      expect(sesion.ultimoHeartbeatEn).toEqual(T1);
    });

    it('es monotónico: un evento atrasado no hace retroceder el heartbeat', () => {
      const sesion = guardada();
      sesion.registrarHeartbeat(T2);

      sesion.registrarHeartbeat(T1);

      expect(sesion.ultimoHeartbeatEn).toEqual(T2);
    });

    it('rechaza un heartbeat anterior al inicio', () => {
      expect(() =>
        guardada().registrarHeartbeat(new Date('2026-11-25T13:00:00.000Z')),
      ).toThrow(TrackingDatosInvalidosError);
    });

    it('solo una sesión activa y guardada registra heartbeat', () => {
      expect(() => nueva().registrarHeartbeat(T1)).toThrow(
        TrackingSesionEstadoInvalidoError,
      );

      const cerrada = guardada();
      cerrada.finalizar(T1);

      expect(() => cerrada.registrarHeartbeat(T2)).toThrow(
        TrackingSesionEstadoInvalidoError,
      );
    });
  });

  describe('finalizar', () => {
    it('cierra la sesión en el instante dado', () => {
      const sesion = guardada();

      sesion.finalizar(T1);

      expect(sesion.isFinalizada).toBe(true);
      expect(sesion.finalizadoEn).toEqual(T1);
    });

    it('es idempotente: repetir el apagado no cambia nada', () => {
      const sesion = guardada();
      sesion.finalizar(T1);

      sesion.finalizar(T2);

      expect(sesion.finalizadoEn).toEqual(T1);
    });

    it('no puede terminar antes de su último heartbeat ni antes de iniciar', () => {
      const sesion = guardada();
      sesion.registrarHeartbeat(T2);

      expect(() => sesion.finalizar(T1)).toThrow(TrackingDatosInvalidosError);
      expect(() =>
        guardada().finalizar(new Date('2026-11-25T13:00:00.000Z')),
      ).toThrow(TrackingDatosInvalidosError);
    });

    it('una sesión expirada no se finaliza manualmente', () => {
      const sesion = guardada();
      sesion.expirar();

      expect(() => sesion.finalizar(T2)).toThrow(
        TrackingSesionEstadoInvalidoError,
      );
    });

    it('una sesión sin guardar no se puede finalizar', () => {
      expect(() => nueva().finalizar(T1)).toThrow(
        TrackingSesionEstadoInvalidoError,
      );
    });
  });

  describe('expirar', () => {
    it('termina en el último heartbeat confiable, no en el momento de detectarlo', () => {
      const sesion = guardada();
      sesion.registrarHeartbeat(T1);

      sesion.expirar();

      expect(sesion.estado).toBe(EstadoTrackingTecnico.EXPIRADA);
      expect(sesion.finalizadoEn).toEqual(T1);
      expect(sesion.estaCerrada).toBe(true);
    });

    it('una sesión ya finalizada no se convierte en expirada', () => {
      const sesion = guardada();
      sesion.finalizar(T1);

      sesion.expirar();

      expect(sesion.isFinalizada).toBe(true);
    });

    it('expirar dos veces es inocuo', () => {
      const sesion = guardada();
      sesion.expirar();
      sesion.expirar();

      expect(sesion.isExpirada).toBe(true);
    });
  });

  describe('hydrate', () => {
    it('rechaza estados incoherentes', () => {
      expect(() =>
        guardada({ estado: EstadoTrackingTecnico.ACTIVA, finalizadoEn: T1 }),
      ).toThrow(TrackingDatosInvalidosError);
      expect(() =>
        guardada({
          estado: EstadoTrackingTecnico.FINALIZADA,
          finalizadoEn: null,
        }),
      ).toThrow(TrackingDatosInvalidosError);
      expect(() =>
        guardada({
          estado: EstadoTrackingTecnico.EXPIRADA,
          finalizadoEn: T1,
          ultimoHeartbeatEn: T0,
        }),
      ).toThrow(TrackingDatosInvalidosError);
    });

    it('rechaza un heartbeat anterior al inicio', () => {
      expect(() =>
        guardada({ ultimoHeartbeatEn: new Date('2026-11-25T13:00:00.000Z') }),
      ).toThrow(TrackingDatosInvalidosError);
    });
  });

  it('devuelve copias de las fechas', () => {
    const sesion = nueva();

    sesion.iniciadoEn.setFullYear(1999);
    sesion.toPrimitives().iniciadoEn.setFullYear(1999);

    expect(sesion.iniciadoEn).toEqual(T0);
  });
});
