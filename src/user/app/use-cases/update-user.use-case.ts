import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '../../domain/user-repository';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../../domain/ports/password-hasher.port';

export interface ActualizarUsuarioCommand {
  nombre?: string;
  correo?: string;
  telefono?: string | null;
  rol?: RolUsuario;
  activo?: boolean;
  contrasena?: string;
}

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuariosRepo: UsuarioRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(id: number, command: ActualizarUsuarioCommand) {
    console.log('Desactivando...');
    const usuario = await this.usuariosRepo.findById(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    if (command.correo !== undefined) {
      const normalized = command.correo.trim().toLowerCase();

      if (normalized !== usuario.correo) {
        const duplicate = await this.usuariosRepo.findByCorreo(normalized, {
          incluirEliminados: true,
        });
      }
    }

    if (
      command.nombre !== undefined ||
      command.correo !== undefined ||
      command.telefono !== undefined
    ) {
      usuario.actualizarDatosBasicos({
        nombre: command.nombre,
        correo: command.correo,
        telefono: command.telefono,
      });
    }

    if (command.rol !== undefined) usuario.cambiarRol(command.rol);

    if (command.activo !== undefined) {
      if (command.activo) usuario.activar();
      else usuario.desactivar();
    }

    if (command.contrasena !== undefined) {
      const hash = await this.passwordHasher.hash(command.contrasena);
      usuario.cambiarContrasena(hash);
    }

    const updated = await this.usuariosRepo.update(usuario);
    return updated.toPublicObject();
  }
}
