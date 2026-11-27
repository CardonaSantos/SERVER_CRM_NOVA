import { JwtService } from '@nestjs/jwt';

import {
  SesionActiva,
  SesionesService,
} from 'src/auth/sesiones/sesiones.service';

import {
  AutenticacionSocket,
  extraerTokenSocket,
  HandshakeSocket,
  RechazoConexionSocket,
} from './autenticacion-socket';

const SECRETO = 'secreto-de-prueba-secreto-de-prueba-123';

const jwt = new JwtService({
  secret: SECRETO,
  verifyOptions: { algorithms: ['HS256'] },
});

class SesionesFake {
  sesion: SesionActiva | null = {
    sesionId: 'sesion-1',
    usuario: { id: 7, rol: 'OFICINA', activo: true, empresaId: 1 },
  };

  falla: Error | null = null;

  readonly consultas: Array<[string, number]> = [];

  validarSesionActiva(sesionId: string, usuarioId: number) {
    this.consultas.push([sesionId, usuarioId]);
    if (this.falla) return Promise.reject(this.falla);
    return Promise.resolve(this.sesion);
  }
}

const claims = {
  id: 7,
  nombre: 'Usuario',
  correo: 'usuario@ejemplo.test',
  rol: 'TECNICO',
  activo: true,
  empresaId: 1,
  sid: 'sesion-1',
};

const handshake = (token?: string): HandshakeSocket => ({
  auth: token === undefined ? {} : { token },
  headers: {},
});

async function codigoDe(promesa: Promise<unknown>): Promise<string> {
  try {
    await promesa;
  } catch (error) {
    expect(error).toBeInstanceOf(RechazoConexionSocket);
    return (error as RechazoConexionSocket).data.codigo;
  }
  throw new Error('Se esperaba un rechazo.');
}

describe('AutenticacionSocket', () => {
  let sesiones: SesionesFake;
  let autenticacion: AutenticacionSocket;

  beforeEach(() => {
    sesiones = new SesionesFake();
    autenticacion = new AutenticacionSocket(
      jwt,
      sesiones as unknown as SesionesService,
    );
  });

  it('acepta un token vigente con sesión activa y toma el rol de la BD', async () => {
    const token = jwt.sign(claims, { expiresIn: 600 });
    const { exp } = jwt.decode<{ exp: number }>(token);

    const usuario = await autenticacion.autenticar(
      handshake(`Bearer ${token}`),
    );

    expect(usuario).toEqual({
      usuarioId: 7,
      rol: 'OFICINA',
      sesionId: 'sesion-1',
      tokenExpiraEn: new Date(exp * 1000),
    });
    expect(sesiones.consultas).toEqual([['sesion-1', 7]]);
  });

  it('sin token rechaza con NO_AUTENTICADO', async () => {
    expect(await codigoDe(autenticacion.autenticar(handshake()))).toBe(
      'NO_AUTENTICADO',
    );
  });

  it('un token mal firmado rechaza con NO_AUTENTICADO', async () => {
    const ajeno = new JwtService({
      secret: 'otro-secreto-otro-secreto-otro-1234',
    });
    const token = ajeno.sign(claims, { expiresIn: 600 });

    expect(await codigoDe(autenticacion.autenticar(handshake(token)))).toBe(
      'NO_AUTENTICADO',
    );
  });

  it('un token vencido rechaza con TOKEN_EXPIRADO', async () => {
    const token = jwt.sign({
      ...claims,
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    expect(await codigoDe(autenticacion.autenticar(handshake(token)))).toBe(
      'TOKEN_EXPIRADO',
    );
  });

  it('un token sin expiración o sin sesión rechaza con NO_AUTENTICADO', async () => {
    const sinExp = jwt.sign(claims);
    const sinSid = jwt.sign({ ...claims, sid: undefined }, { expiresIn: 600 });

    expect(await codigoDe(autenticacion.autenticar(handshake(sinExp)))).toBe(
      'NO_AUTENTICADO',
    );
    expect(await codigoDe(autenticacion.autenticar(handshake(sinSid)))).toBe(
      'NO_AUTENTICADO',
    );
    expect(sesiones.consultas).toHaveLength(0);
  });

  it('una sesión revocada o vencida rechaza con SESION_REVOCADA', async () => {
    sesiones.sesion = null;
    const token = jwt.sign(claims, { expiresIn: 600 });

    expect(await codigoDe(autenticacion.autenticar(handshake(token)))).toBe(
      'SESION_REVOCADA',
    );
  });

  it('un fallo de la BD no se disfraza de rechazo', async () => {
    sesiones.falla = new Error('base caída');
    const token = jwt.sign(claims, { expiresIn: 600 });

    await expect(autenticacion.autenticar(handshake(token))).rejects.toThrow(
      'base caída',
    );
  });

  it('el rechazo lleva codigo y message para connect_error', () => {
    const rechazo = new RechazoConexionSocket('TOKEN_EXPIRADO');

    expect(rechazo.message).toBe(rechazo.data.message);
    expect(rechazo.data.codigo).toBe('TOKEN_EXPIRADO');
  });
});

describe('extraerTokenSocket', () => {
  it('lee auth.token con o sin Bearer', () => {
    expect(extraerTokenSocket(handshake('Bearer abc'))).toBe('abc');
    expect(extraerTokenSocket(handshake('abc'))).toBe('abc');
  });

  it('lee la cabecera Authorization solo con Bearer', () => {
    expect(
      extraerTokenSocket({ headers: { authorization: 'Bearer abc' } }),
    ).toBe('abc');
    expect(extraerTokenSocket({ headers: { authorization: 'abc' } })).toBe(
      null,
    );
  });

  it('ignora el token en la query', () => {
    expect(
      extraerTokenSocket({
        headers: {},
        query: { token: 'abc' },
      } as HandshakeSocket),
    ).toBe(null);
  });
});
