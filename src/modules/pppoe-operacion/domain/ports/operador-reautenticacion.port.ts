export const OPERADOR_REAUTENTICACION_PORT = Symbol(
  'OPERADOR_REAUTENTICACION_PORT',
);

/**
 * Datos necesarios para validar nuevamente la contraseña
 * del operador que intenta autorizar una operación PPPoE.
 *
 */
export type ValidarReautenticacionOperadorParams = {
  empresaId: number;

  /**
   * Usuario autenticado que está confirmando la operación.
   */
  operadorId: number;

  /**
   * Contraseña ingresada nuevamente por el operador.
   */
  password: string;
};

/**
 * PUERTO
 */

/**
 * Puerto para validar credenciales sin acoplar el módulo
 * de operaciones PPPoE al sistema concreto de autenticación.
 *
 * La implementación podrá:
 *
 * 1. buscar al usuario dentro de la empresa;
 * 2. verificar que esté activo;
 * 3. comparar el hash mediante bcrypt o el mecanismo vigente;
 * 4. devolver únicamente true o false.
 */
export interface OperadorReautenticacionPort {
  /**
   * Devuelve true únicamente cuando:
   *
   * - el operador existe;
   * - pertenece a la empresa;
   * - está habilitado;
   * - la contraseña coincide.
   *
   * No debe revelar cuál de esas validaciones falló.
   */
  validar(params: ValidarReautenticacionOperadorParams): Promise<boolean>;
}
