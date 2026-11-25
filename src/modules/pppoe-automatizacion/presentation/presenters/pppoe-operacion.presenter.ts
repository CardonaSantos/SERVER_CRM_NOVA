import {
  ResultadoPaginado,
  presentarPaginado,
} from 'src/common/hexagonal/paginacion';

import {
  PppoeOperacionAdminDetalle,
  PppoeOperacionAdminItem,
} from '../../application/services/pppoe-operacion-admin.service';
import { EjecutarOperacionPppoeResult } from '../../public/pppoe-provisionamiento.port';

type Detalle = PppoeOperacionAdminDetalle;
type Paso = Detalle['pasos'][number];
type Reintento = Detalle['reintentos'][number];
type Usuario = NonNullable<Detalle['iniciadoPor']>;
type Servicio = NonNullable<
  Detalle['cuentaPppoe']['accesoInternet']['servicioInternet']
>;

const iso = (fecha: Date | null): string | null =>
  fecha ? fecha.toISOString() : null;

export class PppoeOperacionPresenter {
  /** Resultado de ejecutar, autorizar, reintentar o recuperar una operación. */
  static ejecucion(r: EjecutarOperacionPppoeResult) {
    return {
      operacionId: r.operacionId,
      cuentaPppoeId: r.cuentaPppoeId,
      tipo: r.tipo,
      estadoOperacion: r.estadoOperacion,
      estadoCuenta: r.estadoCuenta,
      numeroIntento: r.numeroIntento,
      reintentable: r.reintentable,
      resultado: r.resultado,
      errorCodigo: r.errorCodigo,
      errorMensaje: r.errorMensaje,
    };
  }

  static item(o: PppoeOperacionAdminItem) {
    const cuenta = o.cuentaPppoe;
    const acceso = cuenta.accesoInternet;
    const perfil = o.perfilHomologacion;
    const instalacion = o.instalacion;
    const desinstalacion = o.desinstalacion;

    return {
      id: o.id,
      empresaId: o.empresaId,
      cuentaPppoeId: o.cuentaPppoeId,
      mikrotikRouterId: o.mikrotikRouterId,
      perfilHomologacionId: o.perfilHomologacionId,
      instalacionId: o.instalacionId,
      desinstalacionId: o.desinstalacionId,
      reintentoDeId: o.reintentoDeId,
      numeroIntento: o.numeroIntento,
      claveIdempotencia: o.claveIdempotencia,
      tipo: o.tipo,
      origen: o.origen,
      canal: o.canal,
      estado: o.estado,
      contextoEliminacion: o.contextoEliminacion,
      iniciadoPorId: o.iniciadoPorId,
      reautenticadoPorId: o.reautenticadoPorId,
      requiereReautenticacion: o.requiereReautenticacion,
      reautenticacionExitosa: o.reautenticacionExitosa,
      reautenticadoEn: iso(o.reautenticadoEn),
      usuarioPppoeSnapshot: o.usuarioPppoeSnapshot,
      codigoPerfilSnapshot: o.codigoPerfilSnapshot,
      routerHostSnapshot: o.routerHostSnapshot,
      routerPuertoSnapshot: o.routerPuertoSnapshot,
      motivo: o.motivo,
      resultado: o.resultado,
      errorCodigo: o.errorCodigo,
      errorMensaje: o.errorMensaje,
      iniciadoEn: iso(o.iniciadoEn),
      finalizadoEn: iso(o.finalizadoEn),
      canceladoEn: iso(o.canceladoEn),
      duracionMs: o.duracionMs,
      creadoEn: o.creadoEn.toISOString(),
      actualizadoEn: o.actualizadoEn.toISOString(),
      empresa: { id: o.empresa.id, nombre: o.empresa.nombre },
      cuentaPppoe: {
        id: cuenta.id,
        accesoInternetId: cuenta.accesoInternetId,
        perfilHomologacionId: cuenta.perfilHomologacionId,
        usuario: cuenta.usuario,
        estado: cuenta.estado,
        generadoEn: cuenta.generadoEn.toISOString(),
        secretCreadoEn: iso(cuenta.secretCreadoEn),
        activadoEn: iso(cuenta.activadoEn),
        suspendidoEn: iso(cuenta.suspendidoEn),
        eliminadoEn: iso(cuenta.eliminadoEn),
        ultimaSincronizacionEn: iso(cuenta.ultimaSincronizacionEn),
        ultimoError: cuenta.ultimoError,
        accesoInternet: {
          id: acceso.id,
          clienteId: acceso.clienteId,
          servicioInternetId: acceso.servicioInternetId,
          tecnologia: acceso.tecnologia,
          metodoAutenticacion: acceso.metodoAutenticacion,
          estado: acceso.estado,
          cliente: {
            id: acceso.cliente.id,
            nombre: acceso.cliente.nombre,
            apellidos: acceso.cliente.apellidos,
            telefono: acceso.cliente.telefono,
            dpi: acceso.cliente.dpi,
            direccion: acceso.cliente.direccion,
          },
          servicioInternet: acceso.servicioInternet
            ? servicio(acceso.servicioInternet)
            : null,
        },
      },
      mikrotikRouter: {
        id: o.mikrotikRouter.id,
        nombre: o.mikrotikRouter.nombre,
        host: o.mikrotikRouter.host,
        sshPort: o.mikrotikRouter.sshPort,
        descripcion: o.mikrotikRouter.descripcion,
        activo: o.mikrotikRouter.activo,
      },
      perfilHomologacion: perfil
        ? {
            id: perfil.id,
            mikrotikRouterId: perfil.mikrotikRouterId,
            servicioInternetId: perfil.servicioInternetId,
            codigoPerfil: perfil.codigoPerfil,
            activo: perfil.activo,
            servicioInternet: servicio(perfil.servicioInternet),
          }
        : null,
      instalacion: instalacion
        ? {
            id: instalacion.id,
            clienteId: instalacion.clienteId,
            servicioInternetId: instalacion.servicioInternetId,
            tipo: instalacion.tipo,
            estado: instalacion.estado,
            fechaProgramada: iso(instalacion.fechaProgramada),
            fechaInicio: iso(instalacion.fechaInicio),
            fechaFinalizacion: iso(instalacion.fechaFinalizacion),
          }
        : null,
      desinstalacion: desinstalacion
        ? {
            id: desinstalacion.id,
            clienteId: desinstalacion.clienteId,
            servicioInternetId: desinstalacion.servicioInternetId,
            accesoInternetId: desinstalacion.accesoInternetId,
            tipo: desinstalacion.tipo,
            motivo: desinstalacion.motivo,
            estado: desinstalacion.estado,
            fechaProgramada: iso(desinstalacion.fechaProgramada),
            fechaInicio: iso(desinstalacion.fechaInicio),
            fechaFinalizacion: iso(desinstalacion.fechaFinalizacion),
          }
        : null,
      iniciadoPor: o.iniciadoPor ? usuario(o.iniciadoPor) : null,
      reautenticadoPor: o.reautenticadoPor ? usuario(o.reautenticadoPor) : null,
      reintentoDe: o.reintentoDe ? reintento(o.reintentoDe) : null,
      conteos: {
        pasos: o.conteos.pasos,
        auditorias: o.conteos.auditorias,
        reintentos: o.conteos.reintentos,
      },
    };
  }

  static listado(resultado: ResultadoPaginado<PppoeOperacionAdminItem>) {
    return presentarPaginado(resultado, PppoeOperacionPresenter.item);
  }

  static detalle(d: Detalle) {
    return {
      ...PppoeOperacionPresenter.item(d),
      pasos: d.pasos.map(paso),
      reintentos: d.reintentos.map(reintento),
    };
  }
}

function servicio(s: Servicio) {
  return {
    id: s.id,
    nombre: s.nombre,
    velocidad: s.velocidad,
    precio: s.precio,
    estado: s.estado,
  };
}

function usuario(u: Usuario) {
  return {
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    telefono: u.telefono,
    rol: u.rol,
    activo: u.activo,
  };
}

function reintento(r: Reintento) {
  return {
    id: r.id,
    numeroIntento: r.numeroIntento,
    estado: r.estado,
    errorCodigo: r.errorCodigo,
    errorMensaje: r.errorMensaje,
    iniciadoEn: iso(r.iniciadoEn),
    finalizadoEn: iso(r.finalizadoEn),
    creadoEn: r.creadoEn.toISOString(),
  };
}

function paso(p: Paso) {
  return {
    id: p.id,
    operacionId: p.operacionId,
    tipo: p.tipo,
    orden: p.orden,
    estado: p.estado,
    comandoSanitizado: p.comandoSanitizado,
    respuestaSanitizada: p.respuestaSanitizada,
    errorCodigo: p.errorCodigo,
    errorMensaje: p.errorMensaje,
    iniciadoEn: iso(p.iniciadoEn),
    finalizadoEn: iso(p.finalizadoEn),
    duracionMs: p.duracionMs,
    creadoEn: p.creadoEn.toISOString(),
    actualizadoEn: p.actualizadoEn.toISOString(),
  };
}
