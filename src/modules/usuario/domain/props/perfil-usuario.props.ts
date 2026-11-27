/** Archivo guardado en el almacenamiento. */
export type ImagenPerfil = {
  url: string;
  key: string;
  bucket: string;
  mimeType: string;
  size: number;
};

export type PerfilUsuarioProps = {
  id: number | null;
  usuarioId: number;
  bio: string | null;
  avatar: ImagenPerfil | null;
  portada: ImagenPerfil | null;
  notificarWhatsApp: boolean;
  notificarPush: boolean;
  notificarSonido: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
};

export type PreferenciasPerfil = {
  bio?: string | null;
  notificarWhatsApp?: boolean;
  notificarPush?: boolean;
  notificarSonido?: boolean;
};
