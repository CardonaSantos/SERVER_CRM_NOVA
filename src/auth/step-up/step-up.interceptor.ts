import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { UsuarioAutenticado } from '../JwtGuard/jwt-payload';
import { VIGENCIA_REAUTENTICACION_SEGUNDOS } from '../sesiones/sesion.constants';
import {
  ejecutarConStepUp,
  MARCADOR_STEP_UP,
} from './contexto-reautenticacion';

export const CAMPO_CONTRASENA = 'auth:campoContrasenaStepUp';

/** true si el usuario se reautenticó (amr 'reauth') hace ≤ 5 min. */
export function tieneStepUpVigente(usuario?: UsuarioAutenticado): boolean {
  if (!usuario?.amr?.includes('reauth') || !usuario.authTime) return false;

  const edadSegundos = Date.now() / 1000 - usuario.authTime;
  return edadSegundos >= 0 && edadSegundos <= VIGENCIA_REAUTENTICACION_SEGUNDOS;
}

/**
 * Transición del step-up (camino doble): si el token trae un step-up
 * vigente, la operación sensible se ejecuta sin pedir la contraseña en el
 * body. Si no, todo sigue como antes (contraseña en el body).
 *
 * Corre después de los guards y antes de los pipes: puede completar el
 * campo de contraseña con el marcador para que pasen las validaciones de
 * presencia de los DTOs existentes.
 */
@Injectable()
export class StepUpInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      user?: UsuarioAutenticado;
      body?: Record<string, unknown>;
    }>();

    const usuario = request.user;

    if (!usuario || !tieneStepUpVigente(usuario)) {
      return next.handle();
    }

    const campo =
      this.reflector.get<string>(CAMPO_CONTRASENA, context.getHandler()) ??
      'contrasenaActual';

    if (request.body && typeof request.body === 'object') {
      const valor = request.body[campo];
      if (typeof valor !== 'string' || valor.length === 0) {
        request.body[campo] = MARCADOR_STEP_UP;
      }
    }

    return new Observable((suscriptor) =>
      ejecutarConStepUp(usuario.id, () => next.handle().subscribe(suscriptor)),
    );
  }
}
