import { AdoptarCuentaPppoeExistenteResult } from '../../application/use-cases/adoptar-cuenta-pppoe-existente.use-case';
import { ProvisionarPppoeClienteManualResult } from '../../application/use-cases/provisionar-pppoe-cliente-manual.use-case';
import { VerificarAdopcionPppoeResult } from '../../application/use-cases/verificar-adopcion-pppoe.use-case';
import { PrepararPrealtaPppoeResult } from '../../public/pppoe-prealta.port';
import { PppoeOperacionPresenter } from './pppoe-operacion.presenter';

/** Respuestas de alta, provisionamiento y adopción. Nunca llevan contraseñas. */
export class PppoeCuentaPresenter {
  static prealta(r: PrepararPrealtaPppoeResult) {
    return {
      cuentaPppoeId: r.cuentaPppoeId,
      empresaId: r.empresaId,
      accesoInternetId: r.accesoInternetId,
      perfilHomologacionId: r.perfilHomologacionId,
      usuario: r.usuario,
      estado: r.estado,
      generadoEn: r.generadoEn.toISOString(),
      creada: r.creada,
    };
  }

  static provisionamiento(r: ProvisionarPppoeClienteManualResult) {
    return {
      cuentaPppoeId: r.cuentaPppoeId,
      completada: r.completada,
      estadoCuenta: r.estadoCuenta,
      creacionSecret: r.creacionSecret
        ? PppoeOperacionPresenter.ejecucion(r.creacionSecret)
        : null,
      activacion: r.activacion
        ? PppoeOperacionPresenter.ejecucion(r.activacion)
        : null,
    };
  }

  static verificacionAdopcion(r: VerificarAdopcionPppoeResult) {
    return {
      empresaId: r.empresaId,
      clienteId: r.clienteId,
      perfilHomologacionId: r.perfilHomologacionId,
      mikrotikRouterId: r.mikrotikRouterId,
      servicioInternetId: r.servicioInternetId,
      usuarioPppoe: r.usuarioPppoe,
      encontrado: r.encontrado,
      passwordCoincide: r.passwordCoincide,
      perfilEsperado: r.perfilEsperado,
      perfilEncontrado: r.perfilEncontrado,
      perfilCoincide: r.perfilCoincide,
      servicioEncontrado: r.servicioEncontrado,
      servicioCompatible: r.servicioCompatible,
      deshabilitado: r.deshabilitado,
      estadoRemoto: r.estadoRemoto,
      cumpleFormatoNova: r.cumpleFormatoNova,
      puedeAdoptar: r.puedeAdoptar,
      advertencias: [...r.advertencias],
    };
  }

  static adopcion(r: AdoptarCuentaPppoeExistenteResult) {
    return {
      empresaId: r.empresaId,
      clienteId: r.clienteId,
      accesoInternetId: r.accesoInternetId,
      cuentaPppoeId: r.cuentaPppoeId,
      perfilHomologacionId: r.perfilHomologacionId,
      mikrotikRouterId: r.mikrotikRouterId,
      servicioInternetId: r.servicioInternetId,
      usuarioPppoe: r.usuarioPppoe,
      estadoCuenta: r.estadoCuenta,
      estadoAcceso: r.estadoAcceso,
      adoptadoPorId: r.adoptadoPorId,
      adoptadoEn: r.adoptadoEn.toISOString(),
      auditoriaId: r.auditoriaId,
      cumpleFormatoNova: r.cumpleFormatoNova,
      advertencias: [...r.advertencias],
    };
  }
}
