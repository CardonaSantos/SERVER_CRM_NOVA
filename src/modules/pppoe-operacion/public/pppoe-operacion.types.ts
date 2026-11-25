/** Tipos de pppoe-operacion que otros módulos pueden usar (estándar §8). */
export {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  EstadoPasoPppoe,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from '../domain/enums/pppoe-operacion.enum';
export type { PppoeOperacionResultado } from '../domain/props/pppoe-operacion.props';
export type {
  PppoeOperacionAgregadoReadModel,
  PppoeOperacionPasoReadModel,
  PppoeOperacionReadModel,
} from '../domain/read-models/pppoe-operacion-agregado.read-model';
export type {
  PppoeOperacionDetalle,
  PppoeOperacionListItem,
  PppoeOperacionPaginatedResult,
} from '../domain/read-models/pppoe-operacion.read-model';
export {
  OperacionPppoeIdempotenciaError,
  OperacionPppoeNoEncontradaError,
} from '../domain/errors/pppoe-operacion.errors';
