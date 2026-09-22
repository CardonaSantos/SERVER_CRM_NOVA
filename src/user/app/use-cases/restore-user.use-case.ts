import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '../../domain/user-repository';

@Injectable()
export class RestoreUserUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuariosRepo: UsuarioRepository,
  ) {}

  async execute(id: number) {
    const usuario = await this.usuariosRepo.findById(id, {
      incluirEliminados: true,
    });

    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    // if (!usuario.eliminado) {
    //   throw new BadRequestException('El usuario no está eliminado');
    // }

    // usuario.restaurar();
    const restored = await this.usuariosRepo.update(usuario);
    return restored.toPublicObject();
  }
}
