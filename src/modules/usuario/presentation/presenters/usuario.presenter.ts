import {
  presentarPaginado,
  RespuestaPaginada,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { MiPerfil } from '../../application/services/mi-perfil.service';
import { UsuarioEntity } from '../../domain/entities/usuario.entity';
import {
  UsuarioDetalle,
  UsuarioListItem,
  UsuarioOpcion,
} from '../../domain/read-models/usuario-listado.read-model';
import {
  ContrasenaCambiadaResponseDto,
  MiPerfilResponseDto,
  UsuarioDetalleResponseDto,
  UsuarioGuardadoResponseDto,
  UsuarioOpcionResponseDto,
  UsuarioResponseDto,
} from '../dto/usuario-response.dto';

export class UsuarioPresenter {
  static guardado(entity: UsuarioEntity): UsuarioGuardadoResponseDto {
    const u = entity.toPrimitives();

    return {
      id: u.id!,
      nombre: u.nombre,
      correo: entity.correoOriginal,
      telefono: u.telefono,
      rol: u.rol,
      estado: entity.estado,
      creadoEn: u.creadoEn.toISOString(),
      actualizadoEn: u.actualizadoEn.toISOString(),
      eliminadoEn: u.eliminadoEn?.toISOString() ?? null,
    };
  }

  static item(u: UsuarioListItem): UsuarioResponseDto {
    return {
      id: u.id,
      nombre: u.nombre,
      correo: u.correo,
      telefono: u.telefono,
      rol: u.rol,
      estado: u.estado,
      avatarUrl: u.avatarUrl,
      creadoEn: u.creadoEn.toISOString(),
      actualizadoEn: u.actualizadoEn.toISOString(),
      eliminadoEn: u.eliminadoEn?.toISOString() ?? null,
    };
  }

  static listado(
    resultado: ResultadoPaginado<UsuarioListItem>,
  ): RespuestaPaginada<UsuarioResponseDto> {
    return presentarPaginado(resultado, (u) => UsuarioPresenter.item(u));
  }

  static detalle(u: UsuarioDetalle): UsuarioDetalleResponseDto {
    return {
      ...UsuarioPresenter.item(u),
      portadaUrl: u.portadaUrl,
      sesionesActivas: u.sesionesActivas,
    };
  }

  static opcion(u: UsuarioOpcion): UsuarioOpcionResponseDto {
    return { id: u.id, nombre: u.nombre, rol: u.rol };
  }

  static miPerfil({ usuario, perfil }: MiPerfil): MiPerfilResponseDto {
    const u = usuario.toPrimitives();
    const p = perfil?.toPrimitives();

    return {
      id: u.id!,
      nombre: u.nombre,
      correo: u.correo,
      telefono: u.telefono,
      rol: u.rol,
      perfil: {
        bio: p?.bio ?? null,
        avatarUrl: p?.avatar?.url ?? null,
        portadaUrl: p?.portada?.url ?? null,
        notificarWhatsApp: p?.notificarWhatsApp ?? true,
        notificarPush: p?.notificarPush ?? true,
        notificarSonido: p?.notificarSonido ?? true,
      },
    };
  }

  static contrasenaCambiada(r: {
    sesionesCerradas: number;
  }): ContrasenaCambiadaResponseDto {
    return { sesionesCerradas: r.sesionesCerradas };
  }
}
