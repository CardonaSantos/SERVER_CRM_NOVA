import { AudienciaNotificacion } from '../enums/audiencia-notificacion.enum';
import { CategoriaNotificacion } from '../enums/categoria-notificacion.enum';
import { SeveridadNotificacion } from '../enums/severidad-notificacion.enum';
import { NotificacionInvalidaError } from '../errors/notificacion.errors';
import { NotificacionEntity } from './notificacion.entity';

const AHORA = new Date('2026-11-27T16:00:00.000Z');

const base = {
  mensaje: '  Zona Norte procesada  ',
  categoria: CategoriaNotificacion.FACTURACION,
  audiencia: AudienciaNotificacion.ROL,
};

describe('NotificacionEntity', () => {
  it('nace con valores limpios, severidad INFO por omisión y la fecha recibida', () => {
    const n = NotificacionEntity.create(
      { ...base, titulo: '  ', ruta: ' /zonas/1 ' },
      AHORA,
    ).toPrimitives();

    expect(n).toMatchObject({
      id: null,
      mensaje: 'Zona Norte procesada',
      titulo: null,
      ruta: '/zonas/1',
      severidad: SeveridadNotificacion.INFO,
      referencia: null,
      creadaEn: AHORA,
    });
  });

  it.each([
    ['sin mensaje', { mensaje: '   ' }],
    ['mensaje enorme', { mensaje: 'x'.repeat(5001) }],
    ['título enorme', { titulo: 'x'.repeat(201) }],
    ['ruta enorme', { ruta: 'x'.repeat(256) }],
    ['referencia sin tipo', { referencia: { tipo: ' ', id: 1 } }],
    ['referencia con id inválido', { referencia: { tipo: 'ZONA', id: 0 } }],
  ])('rechaza %s', (_caso, cambio) => {
    expect(() =>
      NotificacionEntity.create({ ...base, ...cambio }, AHORA),
    ).toThrow(NotificacionInvalidaError);
  });

  it('toPrimitives devuelve copias', () => {
    const n = NotificacionEntity.create(
      { ...base, referencia: { tipo: 'ZONA', id: 3 } },
      AHORA,
    );
    const copia = n.toPrimitives();

    copia.referencia!.id = 99;
    copia.creadaEn.setFullYear(2000);

    expect(n.toPrimitives().referencia).toEqual({ tipo: 'ZONA', id: 3 });
    expect(n.toPrimitives().creadaEn).toEqual(AHORA);
  });
});
