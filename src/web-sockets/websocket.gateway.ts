import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { BroadCastNewMessage } from './websocket.controller';

interface JwtUserPayload {
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  empresaId: number;
  id: number;
}

interface CrmSocketData {
  user?: JwtUserPayload;
}

type CrmSocket = Socket & { data: CrmSocketData };

@Injectable()
@WebSocketGateway({
  namespace: '/ws',
  cors: { origin: '*' },
})
export class CrmGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit
{
  private readonly logger = new Logger(CrmGateway.name);

  @WebSocketServer()
  server: Server;

  private userSockets = new Map<number, Set<string>>();

  constructor(private readonly jwtService: JwtService) {
    // Esto se ejecuta cuando Nest crea la instancia del gateway
    this.logger.log('Constructor CrmGateway llamado');
  }

  // ======================== Ciclo de vida ========================

  //Cuando el módulo que contiene este gateway ha sido inicializado
  onModuleInit() {
    this.logger.log('CrmGateway registrado en el módulo (onModuleInit)');
  }

  // Cuando el servidor WS (Socket.IO) ya está listo
  afterInit(server: Server) {
    this.logger.log(
      `CrmGateway afterInit: namespace "/ws" listo para recibir conexiones`,
    );
  }

  private normalizeToken(raw?: string): string | undefined {
    if (!raw) return undefined;
    return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
  }

  private extractToken(client: Socket): string | undefined {
    // 1) Preferimos handshake.auth.token (socket.io client)
    const fromAuth = (client.handshake.auth as any)?.token as
      | string
      | undefined;
    if (fromAuth) return this.normalizeToken(fromAuth);

    // 2) También podrías aceptar token por query si quieres
    const fromQuery = client.handshake.query?.token as string | undefined;
    if (fromQuery) return this.normalizeToken(fromQuery);

    // 3) O Authorization: Bearer xxx
    const authHeader = client.handshake.headers['authorization'];
    if (typeof authHeader === 'string') {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) return token;
    }

    return undefined;
  }

  private logEstado() {
    const totalSockets =
      [...this.userSockets.values()].reduce((acc, set) => acc + set.size, 0) ||
      0;

    this.logger.log(
      `Usuarios únicos: ${this.userSockets.size} | Sockets activos: ${totalSockets}`,
    );
  }

  async handleConnection(@ConnectedSocket() client: CrmSocket) {
    client.setMaxListeners(40);

    const token = this.extractToken(client);

    this.logger.log(`Token recibido WS: ${token?.slice(0, 30)}...`);

    if (!token) {
      this.logger.warn('WS conexión rechazada: token ausente');
      client.emit('error', { code: 'NO_TOKEN' });
      return client.disconnect(true);
    }

    const decoded: any = this.jwtService.decode(token);
    this.logger.log(`Payload decodificado WS: ${JSON.stringify(decoded)}`);

    if (!token) {
      this.logger.warn('WS conexión rechazada: token ausente');
      client.emit('error', { code: 'NO_TOKEN' });
      return client.disconnect(true);
    }

    let user: JwtUserPayload;

    try {
      user = this.jwtService.verify<JwtUserPayload>(token);
    } catch (err) {
      if (err?.name === 'TokenExpiredError') {
        this.logger.warn('WS conexión rechazada: token expirado');
        client.emit('error', { code: 'TOKEN_EXPIRED' });
      } else {
        this.logger.warn('WS conexión rechazada: token inválido');
        client.emit('error', { code: 'INVALID_TOKEN' });
      }
      this.logger.error(
        `Error verify: ${err instanceof Error ? err.message : err}`,
      );
      return client.disconnect(true);
    }

    client.data.user = user;

    client.join('public');
    client.join(`user:${user.id}`);
    if (user.rol) client.join(`rol:${user.rol}`);
    if (user.empresaId) client.join(`empresa:${user.empresaId}`);

    if (!this.userSockets.has(user.id)) {
      this.userSockets.set(user.id, new Set());
    }
    this.userSockets.get(user.id)!.add(client.id);

    this.logger.log(
      `WS conectado sid=${client.id} uid=${user.id} rol=${user.rol} empresa=${user.empresaId}`,
    );
    this.logEstado();
  }

  handleDisconnect(@ConnectedSocket() client: CrmSocket) {
    const user = client.data.user;
    if (!user) {
      this.logger.log(`WS desconectado sid=${client.id} (sin user en data)`);
      return;
    }

    const set = this.userSockets.get(user.id);
    if (set) {
      set.delete(client.id);
      if (set.size === 0) this.userSockets.delete(user.id);
    }

    this.logger.log(
      `WS desconectado sid=${client.id} uid=${user.id} rol=${user.rol} empresa=${user.empresaId}`,
    );
    this.logEstado();
  }

  // ======================== EVENTOS ========================

  @SubscribeMessage('test:ping')
  handleTestPing(
    @MessageBody()
    payload: {
      message?: string;
      meta?: Record<string, any>;
    },
    @ConnectedSocket() client: CrmSocket,
  ) {
    const user = client.data.user;

    this.logger.log(
      `Ping recibido de uid=${user?.id ?? '-'} rol=${user?.rol ?? '-'}: ${
        payload?.message ?? '-'
      }`,
    );

    client.emit('test:pong', {
      ok: true,
      user,
      echo: payload,
      serverTime: new Date().toISOString(),
    });
  }

  handleTicketChangeStatus(
    empresaId: number,
    ticketId: number,
    nuevoEstado: string,
    titulo: string,
    tecnico: string,
  ) {
    try {
      this.emitToEmpresa(empresaId, 'ticket-soporte:change-status', {
        ticketId,
        nuevoEstado,
        titulo: titulo ?? 'NO ASIGNADO',
        tecnico: tecnico ?? 'NO ASIGNADO',
      });
    } catch (error) {
      throwFatalError(error, this.logger, 'WebGateway - ticketChangeStatus');
    }
  }

  handleRutaChange(empresaId: number, rutaId: number) {
    try {
      this.emitToEmpresa(empresaId, 'ruta-cobro:change-status', {
        rutaId,
      });
    } catch (error) {
      throwFatalError(error, this.logger, 'WebGateway - rutachangeSocket');
    }
  }

  handleFacturacionChangeEvent(empresaId: number) {
    try {
      this.emitToEmpresa(empresaId, 'facturacion:change-event', {});
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'WebGateway - facturacionChangeEvent',
      );
    }
  }

  // En CrmGateway
  handleEmitNewNuviaMessage(empresaId: number, body: BroadCastNewMessage) {
    try {
      // Tu código UI escucha "nuvia:new-message".
      this.emitToEmpresa(empresaId, 'nuvia:new-message', body.data);
    } catch (error) {
      throwFatalError(error, this.logger, 'handleEmitNewNuviaMessage');
    }
  }

  // ======================== helpers públicos ========================

  emitToUser<E extends string, P = any>(userId: number, event: E, payload: P) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToRole<E extends string, P = any>(rol: string, event: E, payload: P) {
    this.server.to(`rol:${rol}`).emit(event, payload);
  }

  emitToEmpresa<E extends string, P = any>(
    empresaId: number,
    event: E,
    payload: P,
  ) {
    this.server.to(`empresa:${empresaId}`).emit(event, payload);
  }

  emitToAll<E extends string, P = any>(event: E, payload: P) {
    this.server.emit(event, payload);
  }

  emitToUsers<E extends string, P = any>(
    event: E,
    payload: P,
    userIds: number[],
  ) {
    for (const uid of userIds) {
      this.server.to(`user:${uid}`).emit(event, payload);
    }
  }
}
