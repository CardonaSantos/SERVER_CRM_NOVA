import {
  ResultadoPaginado,
  presentarPaginado,
} from 'src/common/hexagonal/paginacion';

import { ConsultarCredencialesPppoeCuentaResult } from '../../application/use-cases/consultar-credenciales-pppoe-cuenta.use-case';
import {
  ClientePppoeCuentaDetalleAccion,
  ClientePppoeCuentaDetalleOperacionAccion,
  ClientePppoeCuentaDetalleResult,
  ClientePppoeCuentaDetalleUsuarioResumen,
} from '../../domain/read-models/cliente-pppoe-cuenta-detalle.read-model';
import { ClientePppoeCuentaListItem } from '../../domain/read-models/cliente-pppoe-cuenta-listado.read-model';

const iso = (fecha: Date | null): string | null =>
  fecha ? fecha.toISOString() : null;

export class CuentaPppoePresenter {
  static listItem(c: ClientePppoeCuentaListItem) {
    return {
      cuentaPppoeId: c.cuentaPppoeId,
      accesoInternetId: c.accesoInternetId,
      usuario: c.usuario,
      estadoCuenta: c.estadoCuenta,
      estadoAcceso: c.estadoAcceso,
      generadoEn: c.generadoEn.toISOString(),
      secretCreadoEn: iso(c.secretCreadoEn),
      activadoEn: iso(c.activadoEn),
      suspendidoEn: iso(c.suspendidoEn),
      ultimaSincronizacionEn: iso(c.ultimaSincronizacionEn),
      ultimoError: c.ultimoError,
      cliente: {
        id: c.cliente.id,
        nombre: c.cliente.nombre,
        apellidos: c.cliente.apellidos,
        telefono: c.cliente.telefono,
        dpi: c.cliente.dpi,
      },
      servicioInternet: c.servicioInternet
        ? {
            id: c.servicioInternet.id,
            nombre: c.servicioInternet.nombre,
            velocidad: c.servicioInternet.velocidad,
            precio: c.servicioInternet.precio,
          }
        : null,
      perfilHomologacion: {
        id: c.perfilHomologacion.id,
        codigoPerfil: c.perfilHomologacion.codigoPerfil,
      },
      router: { id: c.router.id, nombre: c.router.nombre },
      origen: c.origen,
      ultimaOperacion: c.ultimaOperacion
        ? {
            id: c.ultimaOperacion.id,
            tipo: c.ultimaOperacion.tipo,
            estado: c.ultimaOperacion.estado,
            creadoEn: c.ultimaOperacion.creadoEn.toISOString(),
            finalizadoEn: iso(c.ultimaOperacion.finalizadoEn),
          }
        : null,
    };
  }

  static listado(resultado: ResultadoPaginado<ClientePppoeCuentaListItem>) {
    return presentarPaginado(resultado, CuentaPppoePresenter.listItem);
  }

  static detalle(d: ClientePppoeCuentaDetalleResult) {
    const op = d.ultimaOperacion;

    return {
      cuentaPppoeId: d.cuentaPppoeId,
      empresaId: d.empresaId,
      accesoInternetId: d.accesoInternetId,
      perfilHomologacionId: d.perfilHomologacionId,
      usuario: d.usuario,
      estadoCuenta: d.estadoCuenta,
      generadoPorId: d.generadoPorId,
      adoptadoPorId: d.adoptadoPorId,
      generadoEn: d.generadoEn.toISOString(),
      adoptadoEn: iso(d.adoptadoEn),
      secretCreadoEn: iso(d.secretCreadoEn),
      activadoEn: iso(d.activadoEn),
      suspendidoEn: iso(d.suspendidoEn),
      eliminadoEn: iso(d.eliminadoEn),
      ultimaSincronizacionEn: iso(d.ultimaSincronizacionEn),
      ultimoError: d.ultimoError,
      actualizadoEn: d.actualizadoEn.toISOString(),
      generadoPor: CuentaPppoePresenter.operador(d.generadoPor),
      adoptadoPor: CuentaPppoePresenter.operador(d.adoptadoPor),
      cliente: {
        id: d.cliente.id,
        nombre: d.cliente.nombre,
        apellidos: d.cliente.apellidos,
        telefono: d.cliente.telefono,
        dpi: d.cliente.dpi,
        direccion: d.cliente.direccion,
        estadoCliente: d.cliente.estadoCliente,
        estadoCobranza: d.cliente.estadoCobranza,
      },
      accesoInternet: {
        id: d.accesoInternet.id,
        tecnologia: d.accesoInternet.tecnologia,
        metodoAutenticacion: d.accesoInternet.metodoAutenticacion,
        estado: d.accesoInternet.estado,
        activadoEn: iso(d.accesoInternet.activadoEn),
        suspendidoEn: iso(d.accesoInternet.suspendidoEn),
        dadoDeBajaEn: iso(d.accesoInternet.dadoDeBajaEn),
        creadoEn: d.accesoInternet.creadoEn.toISOString(),
        actualizadoEn: d.accesoInternet.actualizadoEn.toISOString(),
      },
      servicioInternet: d.servicioInternet
        ? {
            id: d.servicioInternet.id,
            nombre: d.servicioInternet.nombre,
            velocidad: d.servicioInternet.velocidad,
            precio: d.servicioInternet.precio,
            estado: d.servicioInternet.estado,
          }
        : null,
      perfilHomologacion: {
        id: d.perfilHomologacion.id,
        mikrotikRouterId: d.perfilHomologacion.mikrotikRouterId,
        servicioInternetId: d.perfilHomologacion.servicioInternetId,
        codigoPerfil: d.perfilHomologacion.codigoPerfil,
        activo: d.perfilHomologacion.activo,
      },
      router: {
        id: d.router.id,
        nombre: d.router.nombre,
        host: d.router.host,
        sshPort: d.router.sshPort,
        descripcion: d.router.descripcion,
        activo: d.router.activo,
      },
      origen: d.origen,
      instalaciones: d.instalaciones.map((v) => ({
        vinculoId: v.vinculoId,
        accion: v.accion,
        vinculadoEn: v.vinculadoEn.toISOString(),
        instalacion: {
          id: v.instalacion.id,
          tipo: v.instalacion.tipo,
          estado: v.instalacion.estado,
          fechaProgramada: iso(v.instalacion.fechaProgramada),
          fechaInicio: iso(v.instalacion.fechaInicio),
          fechaFinalizacion: iso(v.instalacion.fechaFinalizacion),
          creadoEn: v.instalacion.creadoEn.toISOString(),
        },
      })),
      ultimaOperacion: op
        ? {
            id: op.id,
            tipo: op.tipo,
            estado: op.estado,
            reintentoDeId: op.reintentoDeId,
            numeroIntento: op.numeroIntento,
            motivo: op.motivo,
            errorCodigo: op.errorCodigo,
            errorMensaje: op.errorMensaje,
            iniciadoEn: iso(op.iniciadoEn),
            finalizadoEn: iso(op.finalizadoEn),
            creadoEn: op.creadoEn.toISOString(),
            iniciadoPor: CuentaPppoePresenter.operador(op.iniciadoPor),
          }
        : null,
      conteos: {
        instalaciones: d.conteos.instalaciones,
        operaciones: d.conteos.operaciones,
        auditorias: d.conteos.auditorias,
      },
      acciones: {
        activar: {
          ...CuentaPppoePresenter.accion(d.acciones.activar),
          flujo: d.acciones.activar.flujo,
          instalacionId: d.acciones.activar.instalacionId,
        },
        suspender: CuentaPppoePresenter.accion(d.acciones.suspender),
        reactivar: CuentaPppoePresenter.accion(d.acciones.reactivar),
        reintentarOperacion: CuentaPppoePresenter.accionOperacion(
          d.acciones.reintentarOperacion,
        ),
        recuperarOperacion: CuentaPppoePresenter.accionOperacion(
          d.acciones.recuperarOperacion,
        ),
      },
    };
  }

  /** Respuesta de revelar credenciales; va con Cache-Control: no-store. */
  static credenciales(r: ConsultarCredencialesPppoeCuentaResult) {
    return {
      cuentaPppoeId: r.cuentaPppoeId,
      usuario: r.usuario,
      contrasena: r.contrasena,
    };
  }

  /** Solo lo que identifica al operador; sin correo ni teléfono. */
  private static operador(u: ClientePppoeCuentaDetalleUsuarioResumen | null) {
    return u ? { id: u.id, nombre: u.nombre, activo: u.activo } : null;
  }

  private static accion(a: ClientePppoeCuentaDetalleAccion) {
    return { habilitada: a.habilitada, motivo: a.motivo };
  }

  private static accionOperacion(a: ClientePppoeCuentaDetalleOperacionAccion) {
    return { ...CuentaPppoePresenter.accion(a), operacionId: a.operacionId };
  }
}
