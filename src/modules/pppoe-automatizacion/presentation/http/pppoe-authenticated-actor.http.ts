import { UnauthorizedException } from '@nestjs/common';

import type { Request } from 'express';

export type AuthenticatedPppoeRequest = Request & {
  user?: {
    id?: number | string;

    sub?: number | string;

    userId?: number | string;

    empresaId?: number | string;
  };
};

export type ActorAdministrativoHttp = {
  empresaId: number;

  operadorId: number;

  ipOrigen: string | null;

  userAgent: string | null;
};

export function getAuthenticatedPppoeActor(
  req: AuthenticatedPppoeRequest,
): ActorAdministrativoHttp {
  const rawOperadorId = req.user?.id ?? req.user?.sub ?? req.user?.userId;

  const operadorId = Number(rawOperadorId);

  const empresaId = Number(req.user?.empresaId);

  if (!Number.isInteger(operadorId) || operadorId <= 0) {
    throw new UnauthorizedException(
      'No fue posible identificar al operador autenticado.',
    );
  }

  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    throw new UnauthorizedException(
      'No fue posible identificar la empresa del operador autenticado.',
    );
  }

  return {
    empresaId,

    operadorId,

    ipOrigen: getClientIp(req),

    userAgent: req.headers['user-agent']?.trim() || null,
  };
}

function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0]?.trim() || null;
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0]?.split(',')[0]?.trim() || null;
  }

  return req.ip?.trim() || null;
}
