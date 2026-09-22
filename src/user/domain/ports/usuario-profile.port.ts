// src/user/domain/ports/usuario-profile.port.ts

export const USUARIO_PROFILE_PORT = Symbol('USUARIO_PROFILE_PORT');

export interface UsuarioProfileMediaView {
  url?: string | null;
  [key: string]: unknown;
}

export interface UsuarioProfileView {
  avatar?: UsuarioProfileMediaView | null;
  portada?: UsuarioProfileMediaView | null;
  [key: string]: unknown;
}

export interface UsuarioProfileUpdate {
  bio?: string;
  telefono?: string;
  notificarWhatsApp?: boolean;
  notificarPush?: boolean;
  notificarSonido?: boolean;
}

export interface UsuarioProfilePort {
  obtenerPorUsuarioId(usuarioId: number): Promise<UsuarioProfileView | null>;

  upsertPerfil(
    usuarioId: number,
    data: UsuarioProfileUpdate,
    avatar?: Express.Multer.File,
    portada?: Express.Multer.File,
  ): Promise<unknown>;
}
