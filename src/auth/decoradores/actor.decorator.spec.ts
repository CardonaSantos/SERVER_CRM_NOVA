import { UnauthorizedException } from '@nestjs/common';

import { construirActorHttp } from './actor.decorator';

const usuario = {
  id: 7,
  sub: 7,
  userId: 7,
  nombre: 'Operador',
  correo: 'no-se-usa@ejemplo.com',
  rol: 'ADMIN',
  activo: true,
  empresaId: 1,
  sesionId: 'b3f1c2d4-0000-4000-8000-000000000000',
  amr: ['pwd' as const],
  authTime: null,
};

const peticion = (extra: Record<string, unknown> = {}) =>
  ({
    user: usuario,
    ip: '200.1.2.3',
    headers: { 'user-agent': '  Mozilla/5.0  ' },
    ...extra,
  }) as any;

describe('construirActorHttp', () => {
  it('arma el actor desde req.user y req.ip', () => {
    expect(construirActorHttp(peticion())).toEqual({
      usuarioId: 7,
      empresaId: 1,
      rol: 'ADMIN',
      nombre: 'Operador',
      sesionId: 'b3f1c2d4-0000-4000-8000-000000000000',
      ip: '200.1.2.3',
      userAgent: 'Mozilla/5.0',
    });
  });

  it('ignora x-forwarded-for: la IP sale de req.ip (trust proxy)', () => {
    const actor = construirActorHttp(
      peticion({
        headers: { 'x-forwarded-for': '1.1.1.1, 200.1.2.3' },
      }),
    );

    expect(actor.ip).toBe('200.1.2.3');
    expect(actor.userAgent).toBeNull();
  });

  it('no expone el correo ni otros campos del usuario', () => {
    expect(JSON.stringify(construirActorHttp(peticion()))).not.toContain(
      'ejemplo.com',
    );
  });

  it('recorta un user-agent enorme', () => {
    const actor = construirActorHttp(
      peticion({ headers: { 'user-agent': 'x'.repeat(2_000) } }),
    );

    expect(actor.userAgent).toHaveLength(500);
  });

  it('sin usuario autenticado responde 401', () => {
    expect(() => construirActorHttp(peticion({ user: undefined }))).toThrow(
      UnauthorizedException,
    );
    expect(() =>
      construirActorHttp(peticion({ user: { ...usuario, id: 0 } })),
    ).toThrow(UnauthorizedException);
  });
});
