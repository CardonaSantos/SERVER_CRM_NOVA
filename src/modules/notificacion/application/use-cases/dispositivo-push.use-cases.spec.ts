import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import { DispositivoPushInvalidoError } from '../../domain/errors/notificacion.errors';
import {
  DispositivosPushEnMemoria,
  EnviadorPushFake,
} from '../../test/fakes/notificacion.fake';
import { EnviarPushUseCase } from './enviar-push.use-case';
import { RegistrarDispositivoPushUseCase } from './registrar-dispositivo-push.use-case';
import { RevocarDispositivoPushUseCase } from './revocar-dispositivo-push.use-case';
import { RevocarDispositivosDeSesionesUseCase } from './revocar-dispositivos-de-sesiones.use-case';

const AHORA = new Date('2026-11-27T16:00:00.000Z');
const INSTALACION_A = '11111111-1111-4111-8111-111111111111';
const INSTALACION_B = '22222222-2222-4222-8222-222222222222';
const TOKEN = 'token-fcm-de-prueba-0123456789';

describe('Dispositivos push y envío', () => {
  let dispositivos: DispositivosPushEnMemoria;
  let enviador: EnviadorPushFake;
  let reloj: RelojFijo;
  let registrar: RegistrarDispositivoPushUseCase;

  const registro = (
    cambios: Partial<
      Parameters<RegistrarDispositivoPushUseCase['execute']>[0]
    > = {},
  ) =>
    registrar.execute({
      usuarioId: 7,
      sesionId: 'sesion-1',
      instalacionId: INSTALACION_A,
      token: TOKEN,
      ...cambios,
    });

  beforeEach(() => {
    dispositivos = new DispositivosPushEnMemoria();
    enviador = new EnviadorPushFake();
    reloj = new RelojFijo(AHORA);
    registrar = new RegistrarDispositivoPushUseCase(dispositivos, reloj);
  });

  describe('registrar', () => {
    it('queda activo, a nombre del usuario y de la sesión', async () => {
      const r = await registro({ nombreDispositivo: '  ' });

      expect(r).toEqual({
        instalacionId: INSTALACION_A,
        plataforma: 'ANDROID',
        activo: true,
        registradoEn: AHORA,
      });
      expect(dispositivos.dispositivos.get(INSTALACION_A)).toMatchObject({
        usuarioId: 7,
        sesionId: 'sesion-1',
        nombreDispositivo: null,
      });
    });

    it('otro usuario en el mismo teléfono se queda con la instalación', async () => {
      await registro();
      await registro({ usuarioId: 8, sesionId: 'sesion-2' });

      expect(dispositivos.dispositivos.get(INSTALACION_A)).toMatchObject({
        usuarioId: 8,
        sesionId: 'sesion-2',
      });
    });

    it('el token pasa a la última instalación que lo presenta', async () => {
      await registro();
      await registro({ instalacionId: INSTALACION_B });

      expect([...dispositivos.dispositivos.keys()]).toEqual([INSTALACION_B]);
    });

    it('rechaza instalación o token vacíos', async () => {
      await expect(registro({ token: '  ' })).rejects.toThrow(
        DispositivoPushInvalidoError,
      );
    });
  });

  describe('revocar', () => {
    it('es idempotente y no toca instalaciones de otro usuario', async () => {
      await registro();
      const revocar = new RevocarDispositivoPushUseCase(dispositivos, reloj);

      expect(
        await revocar.execute({ usuarioId: 8, instalacionId: INSTALACION_A }),
      ).toEqual({ instalacionId: INSTALACION_A, revocado: false });
      expect(
        await revocar.execute({ usuarioId: 7, instalacionId: INSTALACION_A }),
      ).toEqual({ instalacionId: INSTALACION_A, revocado: true });
      expect(
        await revocar.execute({ usuarioId: 7, instalacionId: INSTALACION_A }),
      ).toEqual({ instalacionId: INSTALACION_A, revocado: false });
    });

    it('al revocar la sesión se apaga el teléfono que registró', async () => {
      await registro();
      await registro({
        usuarioId: 8,
        sesionId: 'sesion-2',
        instalacionId: INSTALACION_B,
        token: 'otro-token-fcm-0123456789',
      });

      const revocados = await new RevocarDispositivosDeSesionesUseCase(
        dispositivos,
        reloj,
      ).execute({ sesionIds: ['sesion-1', ''] });

      expect(revocados).toBe(1);
      expect(dispositivos.dispositivos.get(INSTALACION_A)?.activo).toBe(false);
      expect(dispositivos.dispositivos.get(INSTALACION_B)?.activo).toBe(true);
    });
  });

  describe('enviar push', () => {
    const enviar = () =>
      new EnviarPushUseCase(dispositivos, enviador, reloj).execute({
        usuarioId: 7,
        titulo: 'Nuevo ticket asignado',
        cuerpo: 'Ticket #15',
        datos: { tipo: 'ticket-soporte.asignacion' },
      });

    it('envía a los teléfonos activos con los valores por omisión', async () => {
      await registro();

      expect(await enviar()).toEqual({
        omitido: null,
        dispositivos: 1,
        exitosos: 1,
        fallidos: 0,
      });
      expect(enviador.enviados[0]).toMatchObject({
        tokens: [TOKEN],
        canal: 'tickets',
        vigenciaMs: 6 * 60 * 60 * 1000,
        sonido: true,
      });
    });

    it('respeta las preferencias del usuario', async () => {
      await registro();
      dispositivos.preferenciasPorUsuario.set(7, { push: false, sonido: true });

      expect((await enviar()).omitido).toBe('PUSH_DESACTIVADO');
      expect(enviador.enviados).toHaveLength(0);
    });

    it('sin teléfonos o sin credenciales no envía', async () => {
      expect((await enviar()).omitido).toBe('SIN_DISPOSITIVOS');

      await registro();
      enviador.configurado = false;

      expect(await enviar()).toMatchObject({
        omitido: 'PROVEEDOR_NO_CONFIGURADO',
        dispositivos: 1,
      });
      expect(enviador.enviados).toHaveLength(0);
    });

    it('desactiva los tokens que el proveedor da por muertos', async () => {
      await registro();
      enviador.invalidos.add(TOKEN);

      expect(await enviar()).toMatchObject({ exitosos: 0, fallidos: 1 });
      expect(dispositivos.dispositivos.get(INSTALACION_A)?.activo).toBe(false);
    });
  });
});
