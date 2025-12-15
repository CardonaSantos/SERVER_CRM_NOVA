import { RolUsuario } from '@prisma/client';
import { Usuario } from '../entities/user.entity';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

export interface UsuarioFilter {
  empresaId?: number;
  rol?: RolUsuario;
  activo?: boolean;
}

export abstract class UsuarioRepository {
  abstract create(usuario: Usuario): Promise<Usuario>;
  abstract update(usuario: Usuario): Promise<Usuario>;

  abstract findById(id: number): Promise<Usuario | null>;
  abstract findByCorreo(correo: string): Promise<Usuario | null>;

  abstract findMany(filter?: UsuarioFilter): Promise<Usuario[]>;

  abstract deleteById(id: number): Promise<void>;
}
