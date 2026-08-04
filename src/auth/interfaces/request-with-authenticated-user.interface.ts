import { Request } from 'express';

export type AuthenticatedRequestUser = {
  /**
   * Algunas estrategias JWT devuelven directamente `id`.
   */
  id?: number | string;

  /**
   * Campo estándar del JWT.
   */
  sub?: number | string;

  /**
   * Nombre normalizado utilizado por algunos controllers.
   */
  operadorId?: number | string;

  empresaId?: number | string;

  nombre?: string;

  correo?: string;

  rol?: string;

  activo?: boolean;

  iat?: number;

  exp?: number;
};

export interface RequestWithAuthenticatedUser extends Request {
  user?: AuthenticatedRequestUser;
}

export type AuthenticatedActor = {
  operadorId: number;

  empresaId: number | null;
};
