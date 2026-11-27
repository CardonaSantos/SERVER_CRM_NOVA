import { EstadoUsuario } from '../../domain/enums/estado-usuario.enum';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';

/** Lo que responden crear, editar, activar, desactivar, eliminar y restaurar. */
export class UsuarioGuardadoResponseDto {
  id: number;
  nombre: string;
  /** El real, también en un eliminado */
  correo: string;
  telefono: string | null;
  rol: RolUsuario;
  estado: EstadoUsuario;
  creadoEn: string;
  actualizadoEn: string;
  eliminadoEn: string | null;
}

export class UsuarioResponseDto extends UsuarioGuardadoResponseDto {
  avatarUrl: string | null;
}

export class UsuarioDetalleResponseDto extends UsuarioResponseDto {
  portadaUrl: string | null;
  /** Sesiones abiertas ahora */
  sesionesActivas: number;
}

export class UsuarioOpcionResponseDto {
  id: number;
  nombre: string;
  rol: RolUsuario;
}

export class PerfilResponseDto {
  bio: string | null;
  avatarUrl: string | null;
  portadaUrl: string | null;
  notificarWhatsApp: boolean;
  notificarPush: boolean;
  notificarSonido: boolean;
}

export class MiPerfilResponseDto {
  id: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: RolUsuario;
  /** Con los valores por defecto si nunca se configuró */
  perfil: PerfilResponseDto;
}

export class ContrasenaCambiadaResponseDto {
  /** Sesiones que se cerraron */
  sesionesCerradas: number;
}
