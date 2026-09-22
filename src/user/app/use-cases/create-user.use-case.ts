import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { Usuario } from '../../domain/entities/usuario.entity';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '../../domain/user-repository';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../../domain/ports/password-hasher.port';

export interface CrearUsuarioCommand {
  empresaId: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  rol: RolUsuario;
  activo?: boolean;
  contrasena: string;
  contrasenaConfirm?: string;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuariosRepo: UsuarioRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(command: CrearUsuarioCommand) {
    if (
      command.contrasenaConfirm !== undefined &&
      command.contrasena !== command.contrasenaConfirm
    ) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const existing = await this.usuariosRepo.findByCorreo(command.correo, {
      incluirEliminados: true,
    });

    // if (existing) {
    //   if (existing.eliminado) {
    //     throw new BadRequestException(
    //       'El correo pertenece a un usuario eliminado. Restaure el usuario en lugar de crearlo nuevamente.',
    //     );
    //   }
    //   throw new BadRequestException('Ya existe un usuario con ese correo');
    // }

    const passwordHash = await this.passwordHasher.hash(command.contrasena);

    const usuario = Usuario.create({
      empresaId: command.empresaId,
      nombre: command.nombre,
      correo: command.correo,
      telefono: command.telefono,
      rol: command.rol,
      activo: command.activo,
      contrasena: passwordHash,
    });

    const created = await this.usuariosRepo.create(usuario);
    return created.toPublicObject();
  }
}
