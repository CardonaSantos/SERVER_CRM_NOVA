import { Perfil } from '../entities/perfil.entity';

export const PERFIL_REPOSITORY = Symbol('PERFIL_REPOSITORY');
export interface PerfilRepository {
  findByUsuarioId(usuarioId: number): Promise<Perfil | null>;
  save(perfil: Perfil): Promise<Perfil>;
  update(perfil: Perfil): Promise<Perfil>;
}
