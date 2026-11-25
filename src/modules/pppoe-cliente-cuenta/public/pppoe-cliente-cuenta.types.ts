/** Tipos de pppoe-cliente-cuenta que otros módulos pueden usar (estándar §8). */
export { EstadoCuentaPppoe } from '../domain/enums/estado-cuenta-pppoe.enum';
export { FlujoActivacionCuentaPppoe } from '../domain/enums/flujo-activacion-cuenta-pppoe.enum';
export type { ClientePppoeCuentaReadModel } from '../domain/read-models/cliente-pppoe-cuenta.read-model';
export type {
  ClientePppoeCuentaDetalleActivacionAccion,
  ClientePppoeCuentaDetalleResult,
} from '../domain/read-models/cliente-pppoe-cuenta-detalle.read-model';
export { CuentaPppoeNoEncontradaError } from '../domain/errors/pppoe-cliente-cuenta.errors';
