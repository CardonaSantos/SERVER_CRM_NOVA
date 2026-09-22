import { Inject, Injectable } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import {
  USUARIO_PROFILE_PORT,
  UsuarioProfilePort,
} from '../../domain/ports/usuario-profile.port';
import { UpdateUserUseCase } from './update-user.use-case';

export interface ActualizarUsuarioPerfilCommand {
  nombre?: string;
  correo?: string;
  telefono?: string;
  contrasena?: string;
  rol?: RolUsuario;
  activo?: boolean;
  bio?: string;
  notificarWhatsApp?: boolean;
  notificarPush?: boolean;
  notificarSonido?: boolean;
}

@Injectable()
export class UpdateUserProfileUseCase {
  constructor(
    private readonly updateUserUseCase: UpdateUserUseCase,
    @Inject(USUARIO_PROFILE_PORT)
    private readonly profilePort: UsuarioProfilePort,
  ) {}

  async execute(
    id: number,
    command: ActualizarUsuarioPerfilCommand,
    avatar?: Express.Multer.File,
    portada?: Express.Multer.File,
  ) {
    const updatedUsuario = await this.updateUserUseCase.execute(id, {
      nombre: command.nombre,
      correo: command.correo,
      telefono: command.telefono,
      contrasena: command.contrasena,
      rol: command.rol,
      activo: command.activo,
    });

    const hasProfileData =
      command.bio !== undefined ||
      command.telefono !== undefined ||
      command.notificarWhatsApp !== undefined ||
      command.notificarPush !== undefined ||
      command.notificarSonido !== undefined ||
      avatar !== undefined ||
      portada !== undefined;

    if (hasProfileData) {
      await this.profilePort.upsertPerfil(
        id,
        {
          bio: command.bio,
          telefono: command.telefono,
          notificarWhatsApp: command.notificarWhatsApp,
          notificarPush: command.notificarPush,
          notificarSonido: command.notificarSonido,
        },
        avatar,
        portada,
      );
    }

    return updatedUsuario;
  }
}
