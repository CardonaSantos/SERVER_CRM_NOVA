import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { ES_PUBLICO } from '../decoradores/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

export type ModoGuardGlobal = 'observacion' | 'estricto';

/** Cada cuánto se resume una misma ruta rechazada en modo observación. */
const INTERVALO_RESUMEN_MS = 10 * 60 * 1000;

/**
 * Guard global (APP_GUARD) — seguridad por omisión (D6): toda ruta exige
 * JWT salvo las marcadas con @Public(). Un controlador nuevo nace protegido.
 *
 * Modo (variable AUTH_GUARD_MODO):
 * - 'observacion' (por omisión, D7): NO rechaza. Registra qué habría
 *   rechazado (método + patrón de ruta, sin query ni datos) para saber qué
 *   consume de verdad el front antes de cerrar. Las rutas que ya tienen
 *   @UseGuards(JwtAuthGuard) siguen rechazando igual que antes.
 * - 'estricto': rechaza con 401. Se activa en la etapa 8.
 */
@Injectable()
export class GuardGlobalAuth implements CanActivate {
  private readonly logger = new Logger('AuthGuardGlobal');

  readonly modo: ModoGuardGlobal =
    process.env.AUTH_GUARD_MODO === 'estricto' ? 'estricto' : 'observacion';

  private readonly vistos = new Map<
    string,
    { cuenta: number; ultimoLog: number }
  >();

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtAuthGuard: JwtAuthGuard,
  ) {
    this.logger.log(
      this.modo === 'estricto'
        ? 'Guard global de JWT en modo ESTRICTO: rutas sin @Public() exigen token.'
        : 'Guard global de JWT en modo OBSERVACIÓN: registra, no rechaza.',
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Gateways WS validan su propio handshake.
    if (context.getType() !== 'http') return true;

    const esPublico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (esPublico) return true;

    try {
      return await this.jwtAuthGuard.canActivate(context);
    } catch (error) {
      if (this.modo === 'estricto') throw error;

      this.observar(context.switchToHttp().getRequest<Request>(), error);
      return true;
    }
  }

  private observar(request: Request, error: unknown) {
    const ruta = `${request.method} ${request.route?.path ?? request.path}`;
    const motivo = !request.headers.authorization
      ? 'sin token'
      : error instanceof UnauthorizedException
        ? String(
            (error.getResponse() as { message?: unknown })?.message ??
              error.message,
          )
        : 'error de autenticación';

    const clave = `${ruta} | ${motivo}`;
    const ahora = Date.now();
    const visto = this.vistos.get(clave);

    if (!visto) {
      this.vistos.set(clave, { cuenta: 1, ultimoLog: ahora });
      this.logger.warn(`[observación] rechazaría ${ruta} (${motivo})`);
      return;
    }

    visto.cuenta++;

    if (ahora - visto.ultimoLog >= INTERVALO_RESUMEN_MS) {
      this.logger.warn(
        `[observación] rechazaría ${ruta} (${motivo}) — ${visto.cuenta} veces en los últimos ${Math.round((ahora - visto.ultimoLog) / 60000)} min`,
      );
      visto.cuenta = 0;
      visto.ultimoLog = ahora;
    }
  }
}
