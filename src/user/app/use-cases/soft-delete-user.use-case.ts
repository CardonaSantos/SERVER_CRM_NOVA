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
export class SoftDeleteUserUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuariosRepo: UsuarioRepository,
  ) {}

  async execute(id: number, eliminadoPorId?: number): Promise<void> {
    const usuario = await this.usuariosRepo.findById(id, {
      incluirEliminados: true,
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    // if (usuario.eliminado) {
    //   throw new BadRequestException('El usuario ya está eliminado');
    // }

    // usuario.eliminar(eliminadoPorId);
    await this.usuariosRepo.update(usuario);
  }
}
