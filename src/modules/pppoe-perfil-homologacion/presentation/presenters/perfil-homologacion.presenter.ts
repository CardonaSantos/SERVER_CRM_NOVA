import {
  RespuestaPaginada,
  ResultadoPaginado,
  presentarPaginado,
} from 'src/common/hexagonal/paginacion';

import {
  PerfilHomologacionListItem,
  PerfilHomologacionReadModel,
  PerfilHomologacionSeleccionable,
  PerfilHomologacionUsuarioResumen,
} from '../../domain/read-models/perfil-homologacion.read-model';

export class PerfilHomologacionPresenter {
  /** Respuesta de crear, obtener, actualizar código, activar y desactivar. */
  static item(p: PerfilHomologacionReadModel) {
    return {
      id: p.id,
      empresaId: p.empresaId,
      mikrotikRouterId: p.mikrotikRouterId,
      servicioInternetId: p.servicioInternetId,
      codigoPerfil: p.codigoPerfil,
      activo: p.activo,
      creadoPorId: p.creadoPorId,
      actualizadoPorId: p.actualizadoPorId,
      creadoEn: p.creadoEn.toISOString(),
      actualizadoEn: p.actualizadoEn.toISOString(),
    };
  }

  static listItem(item: PerfilHomologacionListItem) {
    return {
      id: item.id,
      empresaId: item.empresaId,
      mikrotikRouterId: item.mikrotikRouterId,
      servicioInternetId: item.servicioInternetId,
      codigoPerfil: item.codigoPerfil,
      activo: item.activo,
      mikrotikRouter: {
        id: item.mikrotikRouter.id,
        nombre: item.mikrotikRouter.nombre,
        host: item.mikrotikRouter.host,
        sshPort: item.mikrotikRouter.sshPort,
        descripcion: item.mikrotikRouter.descripcion,
        activo: item.mikrotikRouter.activo,
      },
      servicioInternet: {
        id: item.servicioInternet.id,
        nombre: item.servicioInternet.nombre,
        velocidad: item.servicioInternet.velocidad,
        precio: item.servicioInternet.precio,
        estado: item.servicioInternet.estado,
      },
      creadoPorId: item.creadoPorId,
      creadoPor: PerfilHomologacionPresenter.usuario(item.creadoPor),
      actualizadoPorId: item.actualizadoPorId,
      actualizadoPor: PerfilHomologacionPresenter.usuario(item.actualizadoPor),
      conteos: {
        cuentas: item.conteos.cuentas,
        auditorias: item.conteos.auditorias,
      },
      creadoEn: item.creadoEn.toISOString(),
      actualizadoEn: item.actualizadoEn.toISOString(),
    };
  }

  static listado(
    resultado: ResultadoPaginado<PerfilHomologacionListItem>,
  ): RespuestaPaginada<
    ReturnType<typeof PerfilHomologacionPresenter.listItem>
  > {
    return presentarPaginado(resultado, PerfilHomologacionPresenter.listItem);
  }

  /** Opción para el combo de homologaciones (`GET …/select`). */
  static opcion(s: PerfilHomologacionSeleccionable) {
    return {
      id: s.id,
      codigoPerfil: s.codigoPerfil,
      mikrotikRouterId: s.mikrotikRouterId,
      servicioInternetId: s.servicioInternetId,
      mikrotikRouter: {
        id: s.mikrotikRouter.id,
        nombre: s.mikrotikRouter.nombre,
      },
      servicioInternet: {
        id: s.servicioInternet.id,
        nombre: s.servicioInternet.nombre,
        velocidad: s.servicioInternet.velocidad,
        precio: s.servicioInternet.precio,
      },
    };
  }

  private static usuario(u: PerfilHomologacionUsuarioResumen | null) {
    return u
      ? {
          id: u.id,
          nombre: u.nombre,
          rol: u.rol,
          activo: u.activo,
        }
      : null;
  }
}
