import {
  PppoeAuditoriaListItem,
  PppoeAuditoriaPaginatedResult,
} from '../domain/read-models/pppoe-auditoria-list.read-model';

export class PppoeAuditoriaPresenter {
  static paginatedToHttp(result: PppoeAuditoriaPaginatedResult) {
    return {
      data: result.data.map((item) => this.listItemToHttp(item)),

      meta: {
        total: result.meta.total,

        page: result.meta.page,

        limit: result.meta.limit,

        totalPages: result.meta.totalPages,
      },
    };
  }

  static listItemToHttp(item: PppoeAuditoriaListItem) {
    return {
      id: item.id,

      empresaId: item.empresaId,

      clienteId: item.clienteId,

      accesoInternetId: item.accesoInternetId,

      cuentaPppoeId: item.cuentaPppoeId,

      perfilHomologacionId: item.perfilHomologacionId,

      instalacionId: item.instalacionId,

      desinstalacionId: item.desinstalacionId,

      operacionId: item.operacionId,

      operadorId: item.operadorId,

      origen: item.origen,

      accion: item.accion,

      descripcion: item.descripcion,

      estadoCuentaAnterior: item.estadoCuentaAnterior,

      estadoCuentaNuevo: item.estadoCuentaNuevo,

      usuarioPppoeSnapshot: item.usuarioPppoeSnapshot,

      perfilCodigoSnapshot: item.perfilCodigoSnapshot,

      operadorNombreSnapshot: item.operadorNombreSnapshot,

      datos: item.datos,

      ipOrigen: item.ipOrigen,

      userAgent: item.userAgent,

      creadoEn: item.creadoEn.toISOString(),

      empresa: {
        id: item.empresa.id,

        nombre: item.empresa.nombre,

        telefono: item.empresa.telefono,

        correo: item.empresa.correo,
      },

      cliente: item.cliente
        ? {
            id: item.cliente.id,

            nombre: item.cliente.nombre,

            apellidos: item.cliente.apellidos,

            telefono: item.cliente.telefono,

            dpi: item.cliente.dpi,

            direccion: item.cliente.direccion,
          }
        : null,

      operador: item.operador
        ? {
            id: item.operador.id,

            nombre: item.operador.nombre,

            correo: item.operador.correo,

            telefono: item.operador.telefono,

            rol: item.operador.rol,

            activo: item.operador.activo,
          }
        : null,

      accesoInternet: item.accesoInternet
        ? {
            id: item.accesoInternet.id,

            tecnologia: item.accesoInternet.tecnologia,

            metodoAutenticacion: item.accesoInternet.metodoAutenticacion,

            estado: item.accesoInternet.estado,

            creadoEn: item.accesoInternet.creadoEn.toISOString(),

            servicioInternet: item.accesoInternet.servicioInternet
              ? {
                  ...item.accesoInternet.servicioInternet,
                }
              : null,
          }
        : null,

      cuentaPppoe: item.cuentaPppoe
        ? {
            id: item.cuentaPppoe.id,

            usuario: item.cuentaPppoe.usuario,

            estado: item.cuentaPppoe.estado,

            generadoEn: item.cuentaPppoe.generadoEn.toISOString(),

            activadoEn: item.cuentaPppoe.activadoEn?.toISOString() ?? null,

            suspendidoEn: item.cuentaPppoe.suspendidoEn?.toISOString() ?? null,

            eliminadoEn: item.cuentaPppoe.eliminadoEn?.toISOString() ?? null,

            ultimaSincronizacionEn:
              item.cuentaPppoe.ultimaSincronizacionEn?.toISOString() ?? null,

            ultimoError: item.cuentaPppoe.ultimoError,
          }
        : null,

      perfilHomologacion: item.perfilHomologacion
        ? {
            id: item.perfilHomologacion.id,

            codigoPerfil: item.perfilHomologacion.codigoPerfil,

            activo: item.perfilHomologacion.activo,

            mikrotikRouter: {
              ...item.perfilHomologacion.mikrotikRouter,
            },

            servicioInternet: {
              ...item.perfilHomologacion.servicioInternet,
            },
          }
        : null,

      instalacion: item.instalacion
        ? {
            id: item.instalacion.id,

            tipo: item.instalacion.tipo,

            estado: item.instalacion.estado,

            fechaProgramada:
              item.instalacion.fechaProgramada?.toISOString() ?? null,

            fechaInicio: item.instalacion.fechaInicio?.toISOString() ?? null,

            fechaFinalizacion:
              item.instalacion.fechaFinalizacion?.toISOString() ?? null,
          }
        : null,

      desinstalacion: item.desinstalacion
        ? {
            id: item.desinstalacion.id,

            tipo: item.desinstalacion.tipo,

            motivo: item.desinstalacion.motivo,

            estado: item.desinstalacion.estado,

            fechaProgramada:
              item.desinstalacion.fechaProgramada?.toISOString() ?? null,

            fechaInicio: item.desinstalacion.fechaInicio?.toISOString() ?? null,

            fechaFinalizacion:
              item.desinstalacion.fechaFinalizacion?.toISOString() ?? null,
          }
        : null,

      operacion: item.operacion
        ? {
            id: item.operacion.id,

            tipo: item.operacion.tipo,

            origen: item.operacion.origen,

            estado: item.operacion.estado,

            motivo: item.operacion.motivo,

            errorCodigo: item.operacion.errorCodigo,

            errorMensaje: item.operacion.errorMensaje,

            iniciadoEn: item.operacion.iniciadoEn?.toISOString() ?? null,

            finalizadoEn: item.operacion.finalizadoEn?.toISOString() ?? null,

            creadoEn: item.operacion.creadoEn.toISOString(),

            mikrotikRouter: {
              ...item.operacion.mikrotikRouter,
            },
          }
        : null,
    };
  }
}
