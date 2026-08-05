import {
  PppoeAuditoriaInstalacionAccesoResumen,
  PppoeAuditoriaInstalacionAuditoriaItem,
  PppoeAuditoriaInstalacionCuentaResumen,
  PppoeAuditoriaInstalacionEvento,
  PppoeAuditoriaInstalacionOperacionItem,
  PppoeAuditoriaInstalacionPaginatedResult,
  PppoeAuditoriaInstalacionPaso,
} from '../domain/read-models/pppoe-auditoria-instalacion.read-model';

export class PppoeAuditoriaInstalacionPresenter {
  static paginatedToHttp(result: PppoeAuditoriaInstalacionPaginatedResult) {
    return {
      data: result.data.map((item) =>
        item.tipoRegistro === 'OPERACION'
          ? this.operationToHttp(item)
          : this.independentAuditToHttp(item),
      ),

      meta: {
        total: result.meta.total,
        page: result.meta.page,
        limit: result.meta.limit,
        totalPages: result.meta.totalPages,
      },

      summary: {
        instalacion: {
          ...result.summary.instalacion,
          fechaProgramada:
            result.summary.instalacion.fechaProgramada?.toISOString() ?? null,
          fechaInicio:
            result.summary.instalacion.fechaInicio?.toISOString() ?? null,
          fechaFinalizacion:
            result.summary.instalacion.fechaFinalizacion?.toISOString() ?? null,
          fechaActivacionServicio:
            result.summary.instalacion.fechaActivacionServicio?.toISOString() ??
            null,
        },

        totalEventos: result.summary.totalEventos,
        totalOperaciones: result.summary.totalOperaciones,
        totalPasos: result.summary.totalPasos,

        operacionesExitosas: result.summary.operacionesExitosas,
        operacionesFallidas: result.summary.operacionesFallidas,
        operacionesParciales: result.summary.operacionesParciales,
        operacionesEnCurso: result.summary.operacionesEnCurso,
        operacionesCanceladas: result.summary.operacionesCanceladas,

        ultimaActividadEn:
          result.summary.ultimaActividadEn?.toISOString() ?? null,

        cantidadAccesosPppoe: result.summary.cantidadAccesosPppoe,

        accesosPppoe: result.summary.accesosPppoe.map((access) => ({
          ...this.accessToHttp(access),
          cuentaPppoe: access.cuentaPppoe,
        })),

        cuentaPppoe: result.summary.cuentaPppoe
          ? this.accountToHttp(result.summary.cuentaPppoe)
          : null,
      },
    };
  }

  private static operationToHttp(item: PppoeAuditoriaInstalacionOperacionItem) {
    return {
      tipoRegistro: item.tipoRegistro,
      fecha: item.fecha.toISOString(),

      operacion: {
        ...item.operacion,

        reautenticadoEn: item.operacion.reautenticadoEn?.toISOString() ?? null,

        iniciadoEn: item.operacion.iniciadoEn?.toISOString() ?? null,
        finalizadoEn: item.operacion.finalizadoEn?.toISOString() ?? null,
        canceladoEn: item.operacion.canceladoEn?.toISOString() ?? null,

        creadoEn: item.operacion.creadoEn.toISOString(),
        actualizadoEn: item.operacion.actualizadoEn.toISOString(),
      },

      actores: {
        iniciadoPor: item.actores.iniciadoPor,
        reautenticadoPor: item.actores.reautenticadoPor,
      },

      contexto: {
        accesoInternet: this.accessToHttp(item.contexto.accesoInternet),

        cuentaPppoe: {
          ...item.contexto.cuentaPppoe,

          generadoEn: item.contexto.cuentaPppoe.generadoEn.toISOString(),

          secretCreadoEn:
            item.contexto.cuentaPppoe.secretCreadoEn?.toISOString() ?? null,

          activadoEn:
            item.contexto.cuentaPppoe.activadoEn?.toISOString() ?? null,

          suspendidoEn:
            item.contexto.cuentaPppoe.suspendidoEn?.toISOString() ?? null,

          eliminadoEn:
            item.contexto.cuentaPppoe.eliminadoEn?.toISOString() ?? null,

          ultimaSincronizacionEn:
            item.contexto.cuentaPppoe.ultimaSincronizacionEn?.toISOString() ??
            null,
        },

        router: item.contexto.router,

        perfilHomologacion: item.contexto.perfilHomologacion,
      },

      auditorias: item.auditorias.map((audit) => this.auditToHttp(audit)),
      pasos: item.pasos.map((step) => this.stepToHttp(step)),
    };
  }

  private static independentAuditToHttp(
    item: PppoeAuditoriaInstalacionAuditoriaItem,
  ) {
    return {
      tipoRegistro: item.tipoRegistro,
      fecha: item.fecha.toISOString(),

      auditoria: this.auditToHttp(item.auditoria),

      contexto: {
        accesoInternet: item.contexto.accesoInternet
          ? this.accessToHttp(item.contexto.accesoInternet)
          : null,

        cuentaPppoe: item.contexto.cuentaPppoe
          ? this.accountToHttp(item.contexto.cuentaPppoe)
          : null,

        perfilHomologacion: item.contexto.perfilHomologacion,
      },
    };
  }

  private static auditToHttp(audit: PppoeAuditoriaInstalacionEvento) {
    return {
      ...audit,
      creadoEn: audit.creadoEn.toISOString(),
    };
  }

  private static stepToHttp(step: PppoeAuditoriaInstalacionPaso) {
    return {
      ...step,

      iniciadoEn: step.iniciadoEn?.toISOString() ?? null,
      finalizadoEn: step.finalizadoEn?.toISOString() ?? null,

      creadoEn: step.creadoEn.toISOString(),
      actualizadoEn: step.actualizadoEn.toISOString(),
    };
  }

  private static accessToHttp(access: PppoeAuditoriaInstalacionAccesoResumen) {
    return {
      ...access,

      activadoEn: access.activadoEn?.toISOString() ?? null,
      suspendidoEn: access.suspendidoEn?.toISOString() ?? null,
      dadoDeBajaEn: access.dadoDeBajaEn?.toISOString() ?? null,

      creadoEn: access.creadoEn.toISOString(),
      actualizadoEn: access.actualizadoEn.toISOString(),
    };
  }

  private static accountToHttp(
    account: PppoeAuditoriaInstalacionCuentaResumen,
  ) {
    return {
      ...account,

      generadoEn: account.generadoEn.toISOString(),
      secretCreadoEn: account.secretCreadoEn?.toISOString() ?? null,
      activadoEn: account.activadoEn?.toISOString() ?? null,
      suspendidoEn: account.suspendidoEn?.toISOString() ?? null,
      eliminadoEn: account.eliminadoEn?.toISOString() ?? null,
      ultimaSincronizacionEn:
        account.ultimaSincronizacionEn?.toISOString() ?? null,

      accesoInternet: this.accessToHttp(account.accesoInternet),
    };
  }
}
