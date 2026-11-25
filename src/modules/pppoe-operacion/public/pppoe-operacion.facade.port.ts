import type { ActualizarPasoPppoeOperacionUseCaseInput } from '../application/use-cases/actualizar-paso-pppoe-operacion.use-case';
import type { AutorizarPppoeOperacionUseCaseInput } from '../application/use-cases/autorizar-pppoe-operacion.use-case';
import type { BuscarAgregadoPppoeOperacionUseCaseInput } from '../application/use-cases/buscar-agregado-pppoe-operacion.use-case';
import type { BuscarPppoeOperacionUseCaseInput } from '../application/use-cases/buscar-pppoe-operacion.use-case';
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
  BuscarAgregadoPppoeOperacionUseCaseInput as BuscarAgregadoPppoeOperacionInput,
  BuscarPppoeOperacionUseCaseInput as BuscarPppoeOperacionInput,
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

/** Intento anterior de la cadena (null si la clave ya existía y no se creó nada). */
export type PppoeOperacionReintentoReadModel = PppoeOperacionCreadaReadModel & {
  operacionAnteriorId: number | null;
};

/**
 * Ciclo de vida de una operación PPPoE (crear → autorizar → iniciar →
 * pasos → finalizar, o cancelar/reintentar). La usa el motor de
 * pppoe-automatizacion, que ejecuta los pasos contra el router.
 */
export interface PppoeOperacionFacadePort {
  /** Por id, por clave de idempotencia o el último intento de una cadena. */
  buscar(
    input: BuscarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionReadModel | null>;
  buscarAgregado(
    input: BuscarAgregadoPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAgregadoReadModel | null>;
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
  ): Promise<PppoeOperacionReintentoReadModel>;
  listar(
    input: ListarPppoeOperacionesUseCaseInput,
  ): Promise<PppoeOperacionPaginatedResult>;
  obtenerDetalle(
    input: ObtenerDetallePppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionDetalle>;
}
