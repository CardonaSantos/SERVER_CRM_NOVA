import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { SesionesService } from '../sesiones/sesiones.service';
import {
  construirUsuarioAutenticado,
  JwtPayload,
  UsuarioAutenticado,
} from './jwt-payload';

/*
 * Mismo formato que aceptaba passport-jwt (fromAuthHeaderAsBearerToken):
 * "<esquema> <token>" con uno o más espacios y el esquema "bearer" sin
 * distinguir mayúsculas.
 */
const AUTH_HEADER = /(\S+)\s+(\S+)/;

function extraerTokenBearer(header: unknown): string | null {
  if (typeof header !== 'string') return null;

  const match = AUTH_HEADER.exec(header);

  if (!match || match[1].toLowerCase() !== 'bearer') return null;

  return match[2];
}

/**
 * Guard JWT propio (reemplaza a Passport, decisión D3).
 *
 * Verifica firma y vencimiento con el JwtService global (secreto y
 * algoritmo configurados en AuthModule) y deja en `req.user` la misma
 * estructura que entregaba JwtStrategy.
 *
 * Respuestas idénticas a las de Passport: 401 "Unauthorized" genérico si
 * falta el token o no verifica; los mensajes propios de
 * construirUsuarioAutenticado se devuelven tal cual.
 *
 * Etapa 7: además consulta la sesión (`sid`) en la BD. Revocarla, que
 * expire o desactivar al usuario corta el acceso aunque el JWT siga
 * vigente. rol/activo/empresaId de req.user salen de la BD.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sesionesService: SesionesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: UsuarioAutenticado }>();

    const token = extraerTokenBearer(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException();
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }

    const usuario = construirUsuarioAutenticado(payload);

    const sesion = await this.sesionesService.validarSesionActiva(
      usuario.sesionId,
      usuario.id,
    );

    if (!sesion) {
      throw new UnauthorizedException('La sesión expiró o fue revocada.');
    }

    usuario.rol = sesion.usuario.rol;
    usuario.activo = sesion.usuario.activo;
    usuario.empresaId = sesion.usuario.empresaId;

    request.user = usuario;

    return true;
  }
}
