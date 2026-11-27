import { EventEmitter } from 'events';

import {
  EVENTO_SESIONES_REVOCADAS,
  SesionesService,
} from 'src/auth/sesiones/sesiones.service';
import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import {
  AutenticacionSocket,
  HandshakeSocket,
  RechazoConexionSocket,
  UsuarioSocket,
} from './autenticacion-socket';
import { TiempoRealGateway } from './tiempo-real.gateway';

type Siguiente = (error?: Error) => void;
type Middleware = (socket: SocketFake, next: Siguiente) => void;

class SocketFake {
  data: { usuario?: UsuarioSocket } = {};
  readonly salas: string[] = [];
  readonly emitidos: Array<[string, unknown]> = [];
  desconectado = false;

  constructor(
    readonly handshake: HandshakeSocket = { auth: {}, headers: {} },
  ) {}

  join(salas: string[]) {
    this.salas.push(...salas);
  }

  emit(evento: string, datos: unknown) {
    this.emitidos.push([evento, datos]);
    return true;
  }

  disconnect() {
    this.desconectado = true;
    return this;
  }
}

class EspacioFake {
  middleware?: Middleware;
  readonly sockets = new Map<string, SocketFake>();
  readonly emisiones: Array<{
    salas: string[];
    evento: string;
    datos: unknown;
  }> = [];
  falla: Error | null = null;

  use(fn: Middleware) {
    this.middleware = fn;
    return this;
  }

  to(salas: string[]) {
    if (this.falla) throw this.falla;

    return {
      emit: (evento: string, datos: unknown) => {
        this.emisiones.push({ salas, evento, datos });
        return true;
      },
    };
  }
}

const AHORA = new Date('2026-11-27T16:00:00.000Z');

const usuario = (cambios: Partial<UsuarioSocket> = {}): UsuarioSocket => ({
  usuarioId: 7,
  rol: 'OFICINA',
  sesionId: 'sesion-1',
  tokenExpiraEn: new Date(AHORA.getTime() + 20 * 60_000),
  ...cambios,
});

const vaciarPromesas = () => new Promise((r) => setImmediate(r));

describe('TiempoRealGateway', () => {
  let autenticar: jest.Mock<Promise<UsuarioSocket>, [HandshakeSocket]>;
  let sesiones: { eventos: EventEmitter };
  let espacio: EspacioFake;
  let gateway: TiempoRealGateway;

  const conectar = (u: UsuarioSocket = usuario(), id = 'a') => {
    const socket = new SocketFake();
    socket.data.usuario = u;
    espacio.sockets.set(id, socket);
    gateway.handleConnection(socket as never);
    return socket;
  };

  beforeEach(() => {
    autenticar = jest.fn();
    sesiones = { eventos: new EventEmitter() };
    espacio = new EspacioFake();
    gateway = new TiempoRealGateway(
      { autenticar } as unknown as AutenticacionSocket,
      sesiones as unknown as SesionesService,
      new RelojFijo(AHORA),
    );
    (gateway as unknown as { espacio: EspacioFake }).espacio = espacio;
    gateway.onModuleInit();
    gateway.afterInit(espacio as never);
  });

  afterEach(() => jest.useRealTimers());

  describe('handshake', () => {
    const pasar = async (socket: SocketFake) => {
      const next = jest.fn<void, [Error?]>();
      espacio.middleware!(socket, next);
      await vaciarPromesas();
      return next;
    };

    it('deja pasar al autenticado y guarda quién es', async () => {
      autenticar.mockResolvedValue(usuario());
      const socket = new SocketFake();

      const next = await pasar(socket);

      expect(next).toHaveBeenCalledWith();
      expect(socket.data.usuario).toEqual(usuario());
    });

    it('rechaza con el codigo del rechazo', async () => {
      autenticar.mockRejectedValue(new RechazoConexionSocket('TOKEN_EXPIRADO'));

      const next = await pasar(new SocketFake());
      const error = next.mock.calls[0][0] as RechazoConexionSocket;

      expect(error.data).toEqual({
        codigo: 'TOKEN_EXPIRADO',
        message: expect.any(String),
      });
    });

    it('un error inesperado sale como ERROR_INTERNO, sin el mensaje real', async () => {
      autenticar.mockRejectedValue(new Error('detalle interno'));

      const next = await pasar(new SocketFake());
      const error = next.mock.calls[0][0] as RechazoConexionSocket;

      expect(error.data.codigo).toBe('ERROR_INTERNO');
      expect(error.message).not.toContain('detalle interno');
    });
  });

  describe('conexión', () => {
    it('une al socket a autenticados, a su usuario y a su rol', () => {
      const socket = conectar();

      expect(socket.salas).toEqual([
        'autenticados',
        'usuario:7',
        'rol:OFICINA',
      ]);
      expect(socket.desconectado).toBe(false);
    });

    it('sin usuario se desconecta', () => {
      const socket = new SocketFake();

      gateway.handleConnection(socket as never);

      expect(socket.desconectado).toBe(true);
      expect(socket.salas).toHaveLength(0);
    });

    it('al vencer el token avisa TOKEN_EXPIRADO y cierra', () => {
      jest.useFakeTimers();
      const socket = conectar();

      jest.advanceTimersByTime(20 * 60_000 - 1);
      expect(socket.desconectado).toBe(false);

      jest.advanceTimersByTime(1);
      expect(socket.emitidos).toEqual([
        ['error', { codigo: 'TOKEN_EXPIRADO', message: expect.any(String) }],
      ]);
      expect(socket.desconectado).toBe(true);
    });

    it('al desconectarse ya no corre el vencimiento', () => {
      jest.useFakeTimers();
      const socket = conectar();

      gateway.handleDisconnect(socket as never);
      jest.advanceTimersByTime(60 * 60_000);

      expect(socket.emitidos).toHaveLength(0);
    });

    it('al revocar una sesión cierra solo sus sockets con SESION_REVOCADA', () => {
      const revocado = conectar(usuario(), 'a');
      const otro = conectar(
        usuario({ usuarioId: 8, sesionId: 'sesion-2' }),
        'b',
      );

      sesiones.eventos.emit(EVENTO_SESIONES_REVOCADAS, ['sesion-1']);

      expect(revocado.emitidos).toEqual([
        ['error', { codigo: 'SESION_REVOCADA', message: expect.any(String) }],
      ]);
      expect(revocado.desconectado).toBe(true);
      expect(otro.desconectado).toBe(false);
    });
  });

  describe('emitir', () => {
    it('suma los destinos en una sola emisión', () => {
      gateway.emitir(
        'ruta-cobro:cambiada',
        { rutaId: 3 },
        { usuarioIds: [7, 7, 0, -1, 1.5], roles: ['ADMIN'], todos: true },
      );

      expect(espacio.emisiones).toEqual([
        {
          salas: ['autenticados', 'usuario:7', 'rol:ADMIN'],
          evento: 'ruta-cobro:cambiada',
          datos: { rutaId: 3 },
        },
      ]);
    });

    it('sin destino no emite', () => {
      gateway.emitir('facturacion:cambiada', {}, { usuarioIds: [], roles: [] });

      expect(espacio.emisiones).toHaveLength(0);
    });

    it('un fallo de Socket.IO no se propaga', () => {
      espacio.falla = new Error('caído');

      expect(() =>
        gateway.emitir('facturacion:cambiada', {}, { todos: true }),
      ).not.toThrow();
    });
  });
});
