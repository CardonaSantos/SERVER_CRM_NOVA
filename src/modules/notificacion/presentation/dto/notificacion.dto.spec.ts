import { Type } from '@nestjs/common';

import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';

import { ListarNotificacionesQueryDto } from './listar-notificaciones-query.dto';
import { RegistrarDispositivoPushDto } from './registrar-dispositivo-push.dto';

describe('DTO de notificaciones', () => {
  const pipe = new ValidacionGlobalPipe();
  const validar = (
    metatype: Type,
    valor: object,
    type: 'body' | 'query' = 'body',
  ) => pipe.transform(valor, { type, metatype });

  it('convierte los filtros de la bandeja', async () => {
    await expect(
      validar(
        ListarNotificacionesQueryDto,
        {
          page: '2',
          categorias: 'BOT,SOPORTE',
          severidades: ['ALERTA'],
          noLeidas: 'true',
          desde: '2026-11-01',
        },
        'query',
      ),
    ).resolves.toMatchObject({
      page: 2,
      categorias: ['BOT', 'SOPORTE'],
      severidades: ['ALERTA'],
      noLeidas: true,
      desde: '2026-11-01',
    });
  });

  it.each([
    { categorias: 'NO_EXISTE' },
    { noLeidas: 'quizas' },
    { desde: '27/11/2026' },
    { empresaId: '1' },
  ])('la bandeja rechaza %p', async (query) => {
    await expect(
      validar(ListarNotificacionesQueryDto, query, 'query'),
    ).rejects.toThrow();
  });

  it('el registro de push acepta lo que envía la app (sin la instalación, que va en la ruta)', async () => {
    await expect(
      validar(RegistrarDispositivoPushDto, {
        token: 'token-fcm-de-prueba-0123456789',
        nombreDispositivo: 'Pixel',
        modeloDispositivo: 'Pixel 7',
        versionApp: '1.0.0',
      }),
    ).resolves.toBeTruthy();
    await expect(
      validar(RegistrarDispositivoPushDto, {
        token: 'token-fcm-de-prueba-0123456789',
        instalacionId: '11111111-1111-4111-8111-111111111111',
      }),
    ).rejects.toThrow();
    await expect(
      validar(RegistrarDispositivoPushDto, { token: 'corto' }),
    ).rejects.toThrow();
  });
});
