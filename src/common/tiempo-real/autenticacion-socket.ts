import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import {
  construirUsuarioAutenticado,
  JwtPayload,
  UsuarioAutenticado,
} from 'src/auth/JwtGuard/jwt-payload';
import { SesionesService } from 'src/auth/sesiones/sesiones.service';

export type CodigoErrorSocket =
  | 'NO_AUTENTICADO'
  | 'TOKEN_EXPIRADO'
  | 'SESION_REVOCADA'
  | 'ERROR_INTERNO';

const MENSAJES: Record<CodigoErrorSocket, string> = {
  NO_AUTENTICADO: 'Inicie sesión para recibir avisos en vivo.',
  TOKEN_EXPIRADO: 'El acceso venció. Renueve el token y vuelva a conectar.',
  SESION_REVOCADA: 'La sesión expiró o fue cerrada. Inicie sesión de nuevo.',
  ERROR_INTERNO: 'No se pudo conectar a los avisos en vivo. Intente de nuevo.',
};

/** Error de socket con el mismo `codigo` y `message` que HTTP (§7.5). */
export type ErrorSocket = { codigo: CodigoErrorSocket; message: string };

export function errorSocket(codigo: CodigoErrorSocket): ErrorSocket {
  return { codigo, message: MENSAJES[codigo] };
}

/**
 * Rechazo del handshake. Socket.IO entrega `message` y `data` al cliente en
 * `connect_error`.
 */
export class RechazoConexionSocket extends Error {
  readonly data: ErrorSocket;

  constructor(codigo: CodigoErrorSocket) {
    super(MENSAJES[codigo]);
    this.name = RechazoConexionSocket.name;
    this.data = errorSocket(codigo);
  }
}

/** Quién está detrás de un socket. El rol sale de la BD, no del token. */
export type UsuarioSocket = {
  usuarioId: number;
  rol: string;
  sesionId: string;
  tokenExpiraEn: Date;
};

export type HandshakeSocket = {
  auth?: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
};

const BEARER = /^Bearer\s+(\S+)$/i;

/**
 * Token en `auth.token` (con o sin `Bearer `) o en la cabecera
 * `Authorization: Bearer`. Nunca por query: la URL termina en los logs.
 */
export function extraerTokenSocket(handshake: HandshakeSocket): string | null {
  const desdeAuth = handshake.auth?.token;

  if (typeof desdeAuth === 'string' && desdeAuth.trim()) {
    const valor = desdeAuth.trim();
    return BEARER.exec(valor)?.[1] ?? valor;
  }

  const cabecera = handshake.headers.authorization;

  return typeof cabecera === 'string'
    ? (BEARER.exec(cabecera.trim())?.[1] ?? null)
    : null;
}

/**
 * Valida el handshake con las mismas reglas que el guard HTTP: firma,
 * vencimiento, claims y sesión vigente en la BD.
 */
@Injectable()
export class AutenticacionSocket {
  constructor(
    private readonly jwt: JwtService,
    private readonly sesiones: SesionesService,
  ) {}

  /** Lanza `RechazoConexionSocket` si el socket no puede conectarse. */
  async autenticar(handshake: HandshakeSocket): Promise<UsuarioSocket> {
    const token = extraerTokenSocket(handshake);

    if (!token) throw new RechazoConexionSocket('NO_AUTENTICADO');

    let payload: JwtPayload;

    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch (error) {
      throw new RechazoConexionSocket(
        (error as { name?: string })?.name === 'TokenExpiredError'
          ? 'TOKEN_EXPIRADO'
          : 'NO_AUTENTICADO',
      );
    }

    let usuario: UsuarioAutenticado;

    try {
      usuario = construirUsuarioAutenticado(payload);
    } catch {
      throw new RechazoConexionSocket('NO_AUTENTICADO');
    }

    const sesion = await this.sesiones.validarSesionActiva(
      usuario.sesionId,
      usuario.id,
    );

    if (!sesion) throw new RechazoConexionSocket('SESION_REVOCADA');

    return {
      usuarioId: usuario.id,
      rol: sesion.usuario.rol,
      sesionId: usuario.sesionId,
      // construirUsuarioAutenticado ya exige `exp`.
      tokenExpiraEn: new Date(payload.exp! * 1000),
    };
  }
}
