import {
  RegistrarEventoCuentaPppoeProps,
  RegistrarEventoOperacionPppoeProps,
  RegistrarTransicionCuentaPppoeProps,
} from '../domain/props/pppoe-auditoria.props';

/**
 * API pública de pppoe-auditoria (estándar §8): registrar eventos en la
 * bitácora PPPoE. Si no se indica la fecha, la pone el reloj. La bitácora es
 * append-only y nunca debe recibir contraseñas ni secretos.
 */
export const PPPOE_AUDITORIA = Symbol('PPPOE_AUDITORIA');

type ConFechaOpcional<T> = Omit<T, 'creadoEn'> & {
  /** Momento del evento; si se omite, la hora del reloj. */
  creadoEn?: Date;
};

export type RegistrarEventoCuentaInput =
  ConFechaOpcional<RegistrarEventoCuentaPppoeProps>;

export type RegistrarTransicionCuentaInput =
  ConFechaOpcional<RegistrarTransicionCuentaPppoeProps>;

export type RegistrarEventoOperacionInput =
  ConFechaOpcional<RegistrarEventoOperacionPppoeProps>;

/** Cada registro devuelve el id de la auditoría creada. */
export interface PppoeAuditoriaFacadePort {
  /** Evento sobre una cuenta PPPoE (p. ej. credenciales visualizadas). */
  registrarEventoCuenta(input: RegistrarEventoCuentaInput): Promise<number>;

  /** Cambio de estado confirmado de una cuenta PPPoE. */
  registrarTransicionCuenta(
    input: RegistrarTransicionCuentaInput,
  ): Promise<number>;

  /** Evento de una operación técnica PPPoE (iniciada, exitosa, fallida…). */
  registrarEventoOperacion(
    input: RegistrarEventoOperacionInput,
  ): Promise<number>;
}
