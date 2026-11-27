import { PerfilUsuarioEntity } from '../entities/perfil-usuario.entity';

export const PERFIL_USUARIO_REPOSITORY = Symbol('PERFIL_USUARIO_REPOSITORY');

export interface PerfilUsuarioRepositoryPort {
  findByUsuarioId(usuarioId: number): Promise<PerfilUsuarioEntity | null>;

  /** Crea o actualiza el perfil del usuario; deja el teléfono del perfil como estaba. */
  guardar(entity: PerfilUsuarioEntity): Promise<PerfilUsuarioEntity>;
}
