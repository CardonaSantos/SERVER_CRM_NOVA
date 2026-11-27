export const USUARIO = Symbol('USUARIO');

/** Lo que `auth` necesita para validar un login. Nunca incluye eliminados. */
export type CredencialesUsuarioResult = {
  usuarioId: number;
  activo: boolean;
  /** Hash de la contraseña: solo para verificarla, nunca se devuelve ni se registra. */
  contrasenaHash: string;
};

/** Datos de la persona con sesión (login y `GET /auth/profile`). */
export type PerfilSesionResult = {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  empresaId: number;
  avatarUrl: string | null;
  portadaUrl: string | null;
};

/** API del módulo `usuario` para otros módulos (hoy, `auth`). */
export interface UsuarioFacadePort {
  /** Por correo (sin espacios ni mayúsculas); `null` si no existe o está eliminado. */
  buscarCredenciales(correo: string): Promise<CredencialesUsuarioResult | null>;

  /** `false` también si no existe, está inactivo o eliminado. */
  verificarContrasena(usuarioId: number, contrasena: string): Promise<boolean>;

  /** `null` si no existe o está eliminado. */
  obtenerPerfilSesion(usuarioId: number): Promise<PerfilSesionResult | null>;
}
