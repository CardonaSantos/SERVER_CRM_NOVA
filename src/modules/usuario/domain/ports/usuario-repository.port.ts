import { UsuarioEntity } from '../entities/usuario.entity';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

export interface UsuarioRepositoryPort {
  /** Incluye eliminados. */
  findById(id: number): Promise<UsuarioEntity | null>;

  /**
   * Quien tiene hoy ese correo (ya normalizado). Un eliminado tiene uno
   * reservado, así que no aparece.
   */
  findByCorreo(correo: string): Promise<UsuarioEntity | null>;

  /** Lanza `UsuarioCorreoDuplicadoError` si el correo ya existe. */
  create(entity: UsuarioEntity): Promise<UsuarioEntity>;

  /** Persiste los cambios hechos con los métodos de la entidad. */
  update(entity: UsuarioEntity): Promise<UsuarioEntity>;

  /** Bloquea la fila hasta el fin de la unidad de trabajo. */
  bloquearParaModificar(id: number): Promise<void>;

  /**
   * Candado de la unidad de trabajo para quien pueda dejar sin super
   * administrador (desactivar, eliminar, cambiar rol): dos a la vez se esperan.
   */
  bloquearSuperAdmins(): Promise<void>;

  /** Super administradores activos y no eliminados. */
  contarSuperAdminsActivos(): Promise<number>;
}
