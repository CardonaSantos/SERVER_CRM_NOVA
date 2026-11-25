import type { ActualizarPasoPppoeOperacionUseCaseInput } from '../application/use-cases/actualizar-paso-pppoe-operacion.use-case';
import type { AutorizarPppoeOperacionUseCaseInput } from '../application/use-cases/autorizar-pppoe-operacion.use-case';
import type { CancelarPppoeOperacionUseCaseInput } from '../application/use-cases/cancelar-pppoe-operacion.use-case';
import type { CrearPppoeOperacionUseCaseInput } from '../application/use-cases/crear-pppoe-operacion.use-case';
import type { CrearReintentoPppoeOperacionUseCaseInput } from '../application/use-cases/crear-reintento-pppoe-operacion.use-case';
import type { FinalizarPppoeOperacionUseCaseInput } from '../application/use-cases/finalizar-pppoe-operacion.use-case';
import type { IniciarPppoeOperacionUseCaseInput } from '../application/use-cases/iniciar-pppoe-operacion.use-case';
import type { ListarPppoeOperacionesUseCaseInput } from '../application/use-cases/listar-pppoe-operaciones.use-case';
import type { ObtenerDetallePppoeOperacionUseCaseInput } from '../application/use-cases/obtener-detalle-pppoe-operacion.use-case';
import type {
  PppoeOperacionAgregadoReadModel,
  PppoeOperacionReadModel,
} from '../domain/read-models/pppoe-operacion-agregado.read-model';
import type {
  PppoeOperacionDetalle,
  PppoeOperacionPaginatedResult,
} from '../domain/read-models/pppoe-operacion.read-model';

export const PPPOE_OPERACION = Symbol('PPPOE_OPERACION');

export type {
  ActualizarPasoPppoeOperacionUseCaseInput as ActualizarPasoPppoeOperacionInput,
  AutorizarPppoeOperacionUseCaseInput as AutorizarPppoeOperacionInput,
  CancelarPppoeOperacionUseCaseInput as CancelarPppoeOperacionInput,
  CrearPppoeOperacionUseCaseInput as CrearPppoeOperacionInput,
  CrearReintentoPppoeOperacionUseCaseInput as CrearReintentoPppoeOperacionInput,
  FinalizarPppoeOperacionUseCaseInput as FinalizarPppoeOperacionInput,
  IniciarPppoeOperacionUseCaseInput as IniciarPppoeOperacionInput,
  ListarPppoeOperacionesUseCaseInput as ListarPppoeOperacionesInput,
  ObtenerDetallePppoeOperacionUseCaseInput as ObtenerDetallePppoeOperacionInput,
};

/** `creada` es false cuando la clave de idempotencia ya existía. */
export type PppoeOperacionCreadaReadModel = PppoeOperacionAgregadoReadModel & {
  creada: boolean;
};

/**
 * Ciclo de vida de una operación PPPoE (crear → autorizar → iniciar →
 * pasos → finalizar, o cancelar/reintentar). Lo usará el motor de
 * pppoe-automatizacion en C3, en lugar de las entidades y los casos de uso.
 */
export interface PppoeOperacionFacadePort {
  crear(
    input: CrearPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionCreadaReadModel>;
  autorizar(
    input: AutorizarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionReadModel>;
  /** Reclama la operación (EJECUTANDO) de forma atómica. */
  iniciar(
    input: IniciarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAgregadoReadModel>;
  actualizarPaso(
    input: ActualizarPasoPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAgregadoReadModel>;
  finalizar(
    input: FinalizarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAgregadoReadModel>;
  cancelar(
    input: CancelarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAgregadoReadModel>;
  crearReintento(
    input: CrearReintentoPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionCreadaReadModel>;
  listar(
    input: ListarPppoeOperacionesUseCaseInput,
  ): Promise<PppoeOperacionPaginatedResult>;
  obtenerDetalle(
    input: ObtenerDetallePppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionDetalle>;
}
