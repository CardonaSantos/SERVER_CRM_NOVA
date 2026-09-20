import { PerfilHomologacionEntity } from '../domain/entities/ppoe-perfil-homologacion.entity';
import {
  PerfilHomologacionDetalle,
  PerfilHomologacionListItem,
  PerfilHomologacionPaginatedResult,
} from '../domain/models/pppoe-perfil-homologacion.read-model';

export class PpoePerfilHomologacionPresenter {
  /**
   * Salida básica utilizada por:
   * - crear
   * - actualizar código
   * - activar
   * - desactivar
   */
  static toHttp(entity: PerfilHomologacionEntity) {
    const props = entity.toPrimitives();

    return {
      id: props.id,

      empresaId: props.empresaId,

      mikrotikRouterId: props.mikrotikRouterId,

      servicioInternetId: props.servicioInternetId,

      codigoPerfil: props.codigoPerfil,

      activo: props.activo,

      creadoPorId: props.creadoPorId,

      actualizadoPorId: props.actualizadoPorId,

      creadoEn: props.creadoEn.toISOString(),

      actualizadoEn: props.actualizadoEn.toISOString(),
    };
  }

  /**
   * Convierte un registro enriquecido del listado.
   */
  static listItemToHttp(item: PerfilHomologacionListItem) {
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

      creadoPor: item.creadoPor
        ? {
            id: item.creadoPor.id,

            nombre: item.creadoPor.nombre,

            correo: item.creadoPor.correo,

            rol: item.creadoPor.rol,

            activo: item.creadoPor.activo,
          }
        : null,

      actualizadoPorId: item.actualizadoPorId,

      actualizadoPor: item.actualizadoPor
        ? {
            id: item.actualizadoPor.id,

            nombre: item.actualizadoPor.nombre,

            correo: item.actualizadoPor.correo,

            rol: item.actualizadoPor.rol,

            activo: item.actualizadoPor.activo,
          }
        : null,

      conteos: {
        cuentas: item.conteos.cuentas,

        auditorias: item.conteos.auditorias,
      },

      creadoEn: item.creadoEn.toISOString(),

      actualizadoEn: item.actualizadoEn.toISOString(),
    };
  }

  /**
   * Actualmente el detalle utiliza el mismo contrato enriquecido
   * que el item del listado.
   */
  static detalleToHttp(detalle: PerfilHomologacionDetalle) {
    return this.listItemToHttp(detalle);
  }

  /**
   * Convierte el resultado paginado completo.
   */
  static paginatedToHttp(result: PerfilHomologacionPaginatedResult) {
    return {
      data: result.items.map((item) => this.listItemToHttp(item)),

      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
}
