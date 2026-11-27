import { Inject, Logger, OnModuleInit } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';

import {
  EVENTO_SESIONES_REVOCADAS,
  SesionesService,
} from 'src/auth/sesiones/sesiones.service';
import { validarOrigen } from 'src/common/http/origenes-permitidos';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import {
  AutenticacionSocket,
  CodigoErrorSocket,
  errorSocket,
  RechazoConexionSocket,
  UsuarioSocket,
} from './autenticacion-socket';
import { DestinoTiempoReal, TiempoRealPort } from './tiempo-real.port';

/** Evento con el que el servidor avisa por qué cierra un socket (§7.5). */
export const EVENTO_ERROR_SOCKET = 'error';

export const SALA_AUTENTICADOS = 'autenticados';
export const salaUsuario = (usuarioId: number) => `usuario:${usuarioId}`;
export const salaRol = (rol: string) => `rol:${rol}`;

/** Tope de `setTimeout` (~24 días); un token dura minutos. */
const MAXIMO_TEMPORIZADOR_MS = 2_147_483_647;

type DatosSocket = {
  usuario?: UsuarioSocket;
  vencimiento?: ReturnType<typeof setTimeout>;
};

type SocketCrm = Socket & { data: DatosSocket };

/**
 * Socket.IO en `/ws`. Solo entra quien pasa la autenticación del handshake;
 * el socket se cierra cuando vence su token o se revoca su sesión, y el
 * cliente vuelve a conectar con un token vigente. No recibe eventos del
 * cliente: solo emite.
 */
@WebSocketGateway({
  namespace: '/ws',
  cors: { origin: validarOrigen, credentials: true },
})
export class TiempoRealGateway
  implements
    TiempoRealPort,
    OnModuleInit,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect
{
  private readonly logger = new Logger(TiempoRealGateway.name);

  @WebSocketServer()
  private readonly espacio?: Namespace;

  constructor(
    private readonly autenticacion: AutenticacionSocket,
    private readonly sesiones: SesionesService,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  onModuleInit(): void {
    this.sesiones.eventos.on(EVENTO_SESIONES_REVOCADAS, (ids: string[]) =>
      this.cerrarSesiones(ids),
    );
  }

  afterInit(espacio: Namespace): void {
    espacio.use((socket, next) => {
      this.autenticacion.autenticar(socket.handshake).then(
        (usuario) => {
          (socket as SocketCrm).data.usuario = usuario;
          next();
        },
        (error: unknown) => next(this.rechazo(error)),
      );
    });
  }

  handleConnection(socket: SocketCrm): void {
    const usuario = socket.data.usuario;

    if (!usuario) {
      socket.disconnect(true);
      return;
    }

    void socket.join([
      SALA_AUTENTICADOS,
      salaUsuario(usuario.usuarioId),
      salaRol(usuario.rol),
    ]);

    const restante =
      usuario.tokenExpiraEn.getTime() - this.reloj.ahora().getTime();

    socket.data.vencimiento = setTimeout(
      () => this.cerrar(socket, 'TOKEN_EXPIRADO'),
      Math.min(Math.max(restante, 0), MAXIMO_TEMPORIZADOR_MS),
    );
    socket.data.vencimiento.unref?.();

    this.logger.debug(`Socket conectado del usuario ${usuario.usuarioId}.`);
  }

  handleDisconnect(socket: SocketCrm): void {
    if (socket.data.vencimiento) clearTimeout(socket.data.vencimiento);
  }

  emitir(evento: string, datos: object, destino: DestinoTiempoReal): void {
    const salas = new Set<string>();

    if (destino.todos) salas.add(SALA_AUTENTICADOS);

    for (const id of destino.usuarioIds ?? []) {
      if (Number.isInteger(id) && id > 0) salas.add(salaUsuario(id));
    }

    for (const rol of destino.roles ?? []) salas.add(salaRol(rol));

    if (!this.espacio || salas.size === 0) return;

    try {
      this.espacio.to([...salas]).emit(evento, datos);
    } catch (error) {
      this.logger.error(
        `No se pudo emitir ${evento}.`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private cerrarSesiones(sesionIds: string[]): void {
    if (!this.espacio || sesionIds.length === 0) return;

    const revocadas = new Set(sesionIds);

    for (const socket of this.espacio.sockets.values()) {
      const sesionId = (socket as SocketCrm).data.usuario?.sesionId;

      if (sesionId && revocadas.has(sesionId)) {
        this.cerrar(socket as SocketCrm, 'SESION_REVOCADA');
      }
    }
  }

  private cerrar(socket: SocketCrm, codigo: CodigoErrorSocket): void {
    socket.emit(EVENTO_ERROR_SOCKET, errorSocket(codigo));
    socket.disconnect(true);
  }

  private rechazo(error: unknown): RechazoConexionSocket {
    if (error instanceof RechazoConexionSocket) return error;

    this.logger.error(
      'Falló la autenticación de un socket.',
      error instanceof Error ? error.stack : String(error),
    );

    return new RechazoConexionSocket('ERROR_INTERNO');
  }
}
