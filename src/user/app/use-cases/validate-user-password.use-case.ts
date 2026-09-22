import { Inject, Injectable } from '@nestjs/common';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '../../domain/user-repository';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../../domain/ports/password-hasher.port';

@Injectable()
export class ValidateUserPasswordUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuariosRepo: UsuarioRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(usuarioId: number, contrasenaActual: string): Promise<boolean> {
    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0 ||
      typeof contrasenaActual !== 'string' ||
      contrasenaActual.length === 0
    ) {
      return false;
    }

    const usuario = await this.usuariosRepo.findById(usuarioId);
    if (!usuario || !usuario.activo) return false;

    return this.passwordHasher.compare(contrasenaActual, usuario.contrasena);
  }
}
