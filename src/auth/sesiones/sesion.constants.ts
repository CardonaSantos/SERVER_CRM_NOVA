import { PlataformaSesion } from '@prisma/client';

/** Vida del access token (JWT). §3.1: 20 minutos. */
export const ACCESS_TOKEN_TTL_SEGUNDOS = 20 * 60;

const DIA_MS = 24 * 60 * 60 * 1000;

export interface PoliticaSesion {
  /** Vida de cada refresh token emitido. */
  refreshMs: number;
  /** Sin refresh en este lapso, la sesión expira (deslizante). */
  inactividadMs: number;
  /** Tope duro desde el login; ningún refresh lo extiende. */
  absolutaMs: number;
}

/**
 * §3.1 (confirmado por el dueño). Android: los técnicos trabajan sin señal;
 * inactividad 30 d y absoluto 90 d (decisión del dueño, 2026-11-23).
 */
export const POLITICA_SESION: Record<PlataformaSesion, PoliticaSesion> = {
  WEB: {
    refreshMs: 7 * DIA_MS,
    inactividadMs: 3 * DIA_MS,
    absolutaMs: 14 * DIA_MS,
  },
  ANDROID: {
    refreshMs: 30 * DIA_MS,
    inactividadMs: 30 * DIA_MS,
    absolutaMs: 90 * DIA_MS,
  },
};

/**
 * Si un refresh ya canjeado reaparece dentro de este margen se trata como
 * carrera benigna (dos pestañas refrescando a la vez): se rechaza sin
 * revocar la sesión. Pasado el margen es reutilización: se revoca.
 */
export const GRACIA_REUTILIZACION_MS = 30 * 1000;

/** Vigencia del step-up (amr 'reauth') para operaciones sensibles. */
export const VIGENCIA_REAUTENTICACION_SEGUNDOS = 5 * 60;

export const MOTIVO_REVOCACION = {
  LOGOUT: 'LOGOUT',
  REVOCADA_POR_USUARIO: 'REVOCADA_POR_USUARIO',
  CERRAR_OTRAS: 'CERRAR_OTRAS',
  REUTILIZACION_REFRESH: 'REUTILIZACION_REFRESH',
  USUARIO_INACTIVO: 'USUARIO_INACTIVO',
} as const;

export type MotivoRevocacion =
  (typeof MOTIVO_REVOCACION)[keyof typeof MOTIVO_REVOCACION];
