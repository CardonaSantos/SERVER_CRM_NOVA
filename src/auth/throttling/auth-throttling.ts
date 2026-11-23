import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  Throttle,
  ThrottlerGuard,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';

/*
 * Límite de intentos para endpoints que reciben una contraseña:
 * login y reautenticación (contrasenaActual en el body).
 *
 * El ThrottlerGuard NO es global: solo corre donde se aplican los
 * decoradores de abajo. El resto de la API no cambia de comportamiento.
 *
 * Dos contadores por petición:
 *  - `ip`        → frena a quien prueba muchas cuentas desde una IP.
 *  - `identidad` → frena a quien insiste sobre una misma cuenta. Una
 *                  oficina completa sale por una sola IP; limitar solo por
 *                  IP bloquearía a todo el equipo al iniciar turno.
 *
 * Depende de `trust proxy` (main.ts) para que req.ip sea la del cliente.
 * Almacenamiento en memoria: válido mientras haya una sola instancia.
 */

const MINUTO_MS = 60_000;

const IP = 'ip';
const IDENTIDAD = 'identidad';

function normalizarCorreo(valor: unknown): string {
  if (typeof valor !== 'string') return '-';
  return valor.trim().toLowerCase().slice(0, 254) || '-';
}

/*
 * Autenticado (reautenticación): el usuario del JWT. JwtAuthGuard corre
 * antes porque está a nivel de clase.
 * Anónimo (login): IP + correo intentado.
 */
function trackerIdentidad(req: Record<string, any>): string {
  const usuarioId = req.user?.id;

  if (Number.isInteger(usuarioId) && usuarioId > 0) {
    return `usuario:${usuarioId}`;
  }

  return `login:${req.ip}:${normalizarCorreo(req.body?.correo)}`;
}

export const authThrottlerOptions: ThrottlerModuleOptions = {
  errorMessage: 'Demasiados intentos. Espere unos minutos e intente de nuevo.',
  throttlers: [
    {
      name: IP,
      ttl: MINUTO_MS,
      limit: 20,
    },
    {
      name: IDENTIDAD,
      ttl: MINUTO_MS,
      limit: 5,
      blockDuration: 5 * MINUTO_MS,
      getTracker: trackerIdentidad,
    },
  ],
};

/** Login: 5/min por IP+correo (bloqueo de 5 min al pasarse), 20/min por IP. */
export function LimitarIntentosLogin() {
  return applyDecorators(UseGuards(ThrottlerGuard));
}

/**
 * POST /auth/refresh: 60/min por IP en ambos contadores (sin usuario ni
 * correo, `identidad` cae en la IP). Holgado a propósito: una oficina
 * entera refresca cada 20 min detrás de una sola IP. El refresh token
 * es de 256 bits, el límite solo frena abuso.
 */
export function LimitarIntentosRefresh() {
  return applyDecorators(
    UseGuards(ThrottlerGuard),
    Throttle({
      [IP]: { limit: 60, ttl: MINUTO_MS },
      [IDENTIDAD]: { limit: 60, ttl: MINUTO_MS },
    }),
  );
}

/**
 * Endpoints que verifican `contrasenaActual`: 10/min por usuario
 * (bloqueo de 5 min al pasarse), 20/min por IP.
 */
export function LimitarIntentosReautenticacion() {
  return applyDecorators(
    UseGuards(ThrottlerGuard),
    Throttle({ [IDENTIDAD]: { limit: 10, ttl: MINUTO_MS } }),
  );
}
