import { EstadoUsuario } from '../enums/estado-usuario.enum';
import { UsuarioInvalidoError } from '../errors/usuario.errors';

export const LARGO_MAXIMO_NOMBRE = 160;
export const LARGO_MAXIMO_CORREO = 190;
export const LARGO_MAXIMO_TELEFONO = 30;
export const LARGO_MAXIMO_BIO = 2000;

/** Dominio reservado (RFC 2606): nadie puede tener un correo real ahí. */
const DOMINIO_RESERVADO = '@usuarios.invalid';

export function normalizarNombre(nombre: string): string {
  const limpio = nombre?.trim() ?? '';
  if (!limpio) throw new UsuarioInvalidoError('El nombre es obligatorio.');
  if (limpio.length > LARGO_MAXIMO_NOMBRE) {
    throw new UsuarioInvalidoError(
      `El nombre admite hasta ${LARGO_MAXIMO_NOMBRE} caracteres.`,
    );
  }
  return limpio;
}

/** El correo es el usuario del login: se guarda sin espacios y en minúsculas. */
export function normalizarCorreo(correo: string): string {
  const limpio = correo?.trim().toLowerCase() ?? '';
  if (!limpio || !limpio.includes('@')) {
    throw new UsuarioInvalidoError('El correo no es válido.');
  }
  if (limpio.length > LARGO_MAXIMO_CORREO) {
    throw new UsuarioInvalidoError(
      `El correo admite hasta ${LARGO_MAXIMO_CORREO} caracteres.`,
    );
  }
  if (limpio.endsWith(DOMINIO_RESERVADO)) {
    throw new UsuarioInvalidoError('El correo no es válido.');
  }
  return limpio;
}

export function normalizarTelefono(telefono?: string | null): string | null {
  const limpio = telefono?.trim();
  if (!limpio) return null;
  if (limpio.length > LARGO_MAXIMO_TELEFONO) {
    throw new UsuarioInvalidoError(
      `El teléfono admite hasta ${LARGO_MAXIMO_TELEFONO} caracteres.`,
    );
  }
  return limpio;
}

export function normalizarBio(bio?: string | null): string | null {
  const limpio = bio?.trim();
  if (!limpio) return null;
  if (limpio.length > LARGO_MAXIMO_BIO) {
    throw new UsuarioInvalidoError(
      `La descripción admite hasta ${LARGO_MAXIMO_BIO} caracteres.`,
    );
  }
  return limpio;
}

/**
 * El correo es único en la base. Al eliminar un usuario su columna recibe este
 * valor, único por id, para que el correo real pueda usarse en otra cuenta.
 */
export function correoReservado(usuarioId: number): string {
  return `eliminado-${usuarioId}${DOMINIO_RESERVADO}`;
}

export function estadoDe(usuario: {
  activo: boolean;
  eliminadoEn: Date | null;
}): EstadoUsuario {
  if (usuario.eliminadoEn) return EstadoUsuario.ELIMINADO;
  return usuario.activo ? EstadoUsuario.ACTIVO : EstadoUsuario.INACTIVO;
}
