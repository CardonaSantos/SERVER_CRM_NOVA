export interface PerfilUsuarioResponseDto {
  id: number;
  avatarUrl?: string;
  portada?: string;
  bio?: string;
  telefono?: string;
  notificarWhatsApp: boolean;
  notificarPush: boolean;
  notificarSonido: boolean;
  creadoEn: Date;
  actualizadoEn: Date;

  usuario: {
    id: number;
    nombre: string;
    correo: string;
    rol: string;
    activo: boolean;
  };
}
