import { Inject, Injectable } from '@nestjs/common';
import {
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port';
import {
  HASH_CONTRASENA,
  HashContrasenaPort,
} from '../ports/hash-contrasena.port';

export type VerificarContrasenaUsuarioInput = {
  usuarioId: number;
  contrasena: string;
};

/** `false` también si el usuario no existe, está inactivo o eliminado. */
@Injectable()
export class VerificarContrasenaUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepositoryPort,
    @Inject(HASH_CONTRASENA) private readonly hash: HashContrasenaPort,
  ) {}

  async execute(input: VerificarContrasenaUsuarioInput): Promise<boolean> {
    if (
      !Number.isInteger(input.usuarioId) ||
      input.usuarioId <= 0 ||
      typeof input.contrasena !== 'string' ||
      !input.contrasena
    ) {
      return false;
    }

    const usuario = await this.usuarios.findById(input.usuarioId);
    if (!usuario || usuario.eliminado || !usuario.activo) return false;

    return this.hash.verify(input.contrasena, usuario.contrasenaHash);
  }
}
