import { Inject, Injectable } from '@nestjs/common';
import { PerfilUsuarioEntity } from '../../domain/entities/perfil-usuario.entity';
import { UsuarioEntity } from '../../domain/entities/usuario.entity';
import { UsuarioNoEncontradoError } from '../../domain/errors/usuario.errors';
import {
  PERFIL_USUARIO_REPOSITORY,
  PerfilUsuarioRepositoryPort,
} from '../../domain/ports/perfil-usuario-repository.port';
import {
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port';

/** La cuenta propia y su perfil (`null` si nunca lo configuró). */
export type MiPerfil = {
  usuario: UsuarioEntity;
  perfil: PerfilUsuarioEntity | null;
};

/** Lo comparten los casos de uso de `/usuarios/yo`. */
@Injectable()
export class MiPerfilService {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepositoryPort,
    @Inject(PERFIL_USUARIO_REPOSITORY)
    private readonly perfiles: PerfilUsuarioRepositoryPort,
  ) {}

  async usuarioVigente(usuarioId: number): Promise<UsuarioEntity> {
    const usuario = await this.usuarios.findById(usuarioId);
    if (!usuario) throw new UsuarioNoEncontradoError();
    usuario.asegurarVigente();

    return usuario;
  }

  async cargar(usuarioId: number): Promise<MiPerfil> {
    return {
      usuario: await this.usuarioVigente(usuarioId),
      perfil: await this.perfiles.findByUsuarioId(usuarioId),
    };
  }
}
