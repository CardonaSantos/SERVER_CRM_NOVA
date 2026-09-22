// src/user/infraestructure/perfil-service.adapter.ts

import { Injectable } from '@nestjs/common';
import { PerfilService } from 'src/perfil/app/perfil.service';
import {
  UsuarioProfilePort,
  UsuarioProfileUpdate,
  UsuarioProfileView,
} from '../domain/ports/usuario-profile.port';

@Injectable()
export class PerfilServiceAdapter implements UsuarioProfilePort {
  constructor(private readonly perfilService: PerfilService) {}

  async obtenerPorUsuarioId(
    usuarioId: number,
  ): Promise<UsuarioProfileView | null> {
    const perfil =
      await this.perfilService.obtenerPerfilPorUsuarioId(usuarioId);

    return perfil as UsuarioProfileView | null;
  }

  upsertPerfil(
    usuarioId: number,
    data: UsuarioProfileUpdate,
    avatar?: Express.Multer.File,
    portada?: Express.Multer.File,
  ): Promise<unknown> {
    return this.perfilService.upsertPerfil(usuarioId, data, avatar, portada);
  }
}
