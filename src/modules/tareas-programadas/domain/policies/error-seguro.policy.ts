import { esDomainError } from 'src/common/hexagonal/domain-error';

export const CODIGO_ERROR_INESPERADO = 'ERROR_INTERNO';

/**
 * Lo que se guarda de un error en el registro. El mensaje de un DomainError
 * está escrito para mostrarse; el de cualquier otro error puede traer datos
 * técnicos (hosts, SQL, usuarios) y se reemplaza por uno genérico.
 */
export function errorSeguro(error: unknown): {
  codigo: string;
  mensaje: string;
} {
  if (esDomainError(error)) {
    return { codigo: error.codigo, mensaje: error.message };
  }
  return {
    codigo: CODIGO_ERROR_INESPERADO,
    mensaje: 'La tarea falló por un error inesperado.',
  };
}
