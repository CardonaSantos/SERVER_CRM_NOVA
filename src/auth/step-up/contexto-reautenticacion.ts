import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Step-up (D8): contexto de la petición en curso cuando el access token
 * trae un step-up vigente (amr 'reauth' con auth_time reciente).
 *
 * Lo abre StepUpInterceptor alrededor del handler de una
 * @OperacionSensible() y lo consultan los puntos que hoy verifican la
 * contraseña en el body (AuthService.reautenticarUsuarioPorId y el
 * adaptador de reautenticación de operador PPPoE). AsyncLocalStorage evita
 * tener que pasar el dato por todas las capas de negocio.
 */
interface ContextoStepUp {
  usuarioId: number;
}

const almacen = new AsyncLocalStorage<ContextoStepUp>();

/**
 * Valor que el interceptor pone en el campo de contraseña cuando hay
 * step-up vigente y el cliente ya no la envía: solo sirve para pasar las
 * validaciones de presencia de los DTOs. NO es una credencial: fuera de un
 * step-up vigente se verifica como contraseña normal y falla.
 */
export const MARCADOR_STEP_UP = 'step-up:reautenticacion-vigente';

export function ejecutarConStepUp<T>(usuarioId: number, fn: () => T): T {
  return almacen.run({ usuarioId }, fn);
}

/** true solo dentro de una @OperacionSensible con step-up vigente de ESE usuario. */
export function stepUpVigentePara(usuarioId: number): boolean {
  const ctx = almacen.getStore();
  return !!ctx && ctx.usuarioId === usuarioId;
}
