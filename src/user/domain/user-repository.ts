import { RolUsuario } from '@prisma/client';
import { Usuario } from './entities/usuario.entity';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

export interface UsuarioLookupOptions {
  incluirEliminados?: boolean;
}

export interface UsuarioFilter {
  empresaId?: number;
  rol?: RolUsuario;
  activo?: boolean;
  incluirEliminados?: boolean;
  soloEliminados?: boolean;
}

export abstract class UsuarioRepository {
  abstract create(usuario: Usuario): Promise<Usuario>;
  abstract update(usuario: Usuario): Promise<Usuario>;
  abstract findById(
    id: number,
    options?: UsuarioLookupOptions,
  ): Promise<Usuario | null>;
  abstract findByCorreo(
    correo: string,
    options?: UsuarioLookupOptions,
  ): Promise<Usuario | null>;
  abstract findMany(filter?: UsuarioFilter): Promise<Usuario[]>;
}
