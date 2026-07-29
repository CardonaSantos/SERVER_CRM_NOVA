import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from '../enums/pppoe-operacion-operacion-paso.enums';

import { PppoeOperacionPasoEntity } from '../entities/pppoe-operacion-paso.entity';

import { CrearPppoeOperacionPasoInicialProps } from '../props/pppoe-operacion-paso.props';
import { PppoeOperacionEntity } from '../entities/pppoe-operacion.entity';

export type ReclamarPppoeOperacionParaEjecucionParams = {
  empresaId: number;

  operacionId: number;

  estadoEsperado:
    | EstadoOperacionPppoe.PENDIENTE
    | EstadoOperacionPppoe.AUTORIZADA;

  operacionIniciada: PppoeOperacionEntity;
};

/**
 * Token utilizado para inyectar el repositorio
 * de escritura de operaciones PPPoE.
 */
export const PPPOE_OPERACION_REPOSITORY = Symbol('PPPOE_OPERACION_REPOSITORY');

/**
 * Parámetros utilizados para persistir los cambios
 * de un paso dentro de una empresa.
 *
 * empresaId permite comprobar que el paso pertenece
 * a una operación de la empresa esperada.
 */
export type GuardarPppoeOperacionPasoParams = {
  empresaId: number;

  paso: PppoeOperacionPasoEntity;
};

/**
 * ============================================================
 * AGREGADO DE OPERACIÓN
 * ============================================================
 */

/**
 * Representa una operación junto con sus pasos técnicos.
 *
 * PppoeOperacion es la raíz del agregado.
 * PppoeOperacionPaso no existe fuera de una operación.
 */
export type PppoeOperacionAggregate = {
  operacion: PppoeOperacionEntity;

  pasos: PppoeOperacionPasoEntity[];
};

/**
 * Datos necesarios para crear una operación y sus pasos
 * iniciales en una misma operación de persistencia.
 *
 * Los pasos todavía no contienen operacionId porque la
 * operación principal aún no ha sido insertada.
 */
export type CrearPppoeOperacionAggregateParams = {
  operacion: PppoeOperacionEntity;

  pasos: CrearPppoeOperacionPasoInicialProps[];
};

/**
 * ============================================================
 * PARÁMETROS DE BÚSQUEDA POR IDENTIFICADOR
 * ============================================================
 */

/**
 * Parámetros utilizados para localizar una operación
 * por su identificador dentro de una empresa.
 */
export type BuscarPppoeOperacionPorIdParams = {
  empresaId: number;

  operacionId: number;
};

/**
 * Parámetros utilizados para localizar un paso concreto.
 *
 * Se incluye operacionId para asegurar que el paso realmente
 * pertenece a la operación esperada.
 */
export type BuscarPppoeOperacionPasoPorIdParams = {
  empresaId: number;

  operacionId: number;

  pasoId: number;
};

/**
 * Parámetros utilizados para localizar un paso mediante
 * su posición dentro de la secuencia.
 *
 * Ejemplo:
 *
 * operación 25, orden 3 → AGREGAR_SECRET
 */
export type BuscarPppoeOperacionPasoPorOrdenParams = {
  empresaId: number;

  operacionId: number;

  orden: number;
};

/**
 * ============================================================
 * IDEMPOTENCIA
 * ============================================================
 */

/**
 * Parámetros para localizar una operación previamente creada
 * con la misma clave de idempotencia.
 *
 * Permite manejar:
 *
 * - doble clic;
 * - reenvío HTTP;
 * - timeout del cliente;
 * - repetición accidental de una solicitud.
 */
export type BuscarPppoeOperacionPorIdempotenciaParams = {
  empresaId: number;

  claveIdempotencia: string;
};

/**
 * ============================================================
 * OPERACIONES EN CURSO
 * ============================================================
 */

/**
 * Parámetros para revisar si ya existe una operación activa
 * sobre una cuenta PPPoE.
 *
 * Se utiliza antes de crear una nueva operación para evitar
 * que dos procesos modifiquen simultáneamente el mismo secret.
 */
export type BuscarPppoeOperacionEnCursoParams = {
  empresaId: number;

  cuentaPppoeId: number;

  /**
   * Permite restringir la búsqueda a un tipo determinado.
   *
   * Ejemplo:
   *
   * CREAR_SECRET
   */
  tipo?: TipoOperacionPppoe | null;

  /**
   * Estados considerados en curso.
   *
   * Normalmente:
   *
   * - PENDIENTE
   * - AUTORIZADA
   * - EJECUTANDO
   */
  estados: EstadoOperacionPppoe[];

  /**
   * Permite excluir una operación concreta.
   *
   * Será útil durante reintentos o validaciones internas.
   */
  excluirOperacionId?: number | null;
};

/**
 * ============================================================
 * CONSULTAS DE REINTENTOS
 * ============================================================
 */

/**
 * Parámetros para localizar el intento más reciente dentro
 * de una cadena de reintentos.
 *
 * reintentoDeId representa la operación raíz de la cadena.
 */
export type BuscarUltimoIntentoPppoeParams = {
  empresaId: number;

  operacionRaizId: number;
};

/**
 * Parámetros para localizar la operación más reciente
 * realizada sobre una cuenta.
 *
 * Puede utilizarse para comparar el estado actual de la cuenta
 * con el resultado del último movimiento hacia MikroTik.
 */
export type BuscarUltimaOperacionCuentaPppoeParams = {
  empresaId: number;

  cuentaPppoeId: number;

  tipo?: TipoOperacionPppoe | null;
};

/**
 * ============================================================
 * PUERTO DE REPOSITORIO
 * ============================================================
 */

/**
 * Puerto de persistencia del agregado PppoeOperacion.
 *
 * Trabaja con entidades de dominio, no con DTOs HTTP
 * ni con modelos enriquecidos para UI.
 */
export interface PppoeOperacionRepositoryPort {
  /**
   * Crea una operación junto con sus pasos iniciales.
   *
   * La implementación Prisma puede utilizar nested create
   * para garantizar que todos los registros sean creados
   * como una sola unidad.
   */
  createWithSteps(
    params: CrearPppoeOperacionAggregateParams,
  ): Promise<PppoeOperacionAggregate>;

  /**
   * Persiste los cambios realizados mediante los métodos
   * de PppoeOperacionEntity.
   *
   * Ejemplos:
   *
   * - autorizar();
   * - iniciar();
   * - marcarExitosa();
   * - marcarFallida();
   * - cancelar();
   */
  saveOperation(entity: PppoeOperacionEntity): Promise<PppoeOperacionEntity>;

  /**
   * Intenta reclamar atómicamente una operación
   * para comenzar su ejecución técnica.
   *
   * Solo actualiza cuando el registro todavía conserva
   * el estado esperado.
   *
   * Retorna null cuando otra solicitud reclamó o modificó
   * la operación antes de completar la actualización.
   */
  claimForExecution(
    params: ReclamarPppoeOperacionParaEjecucionParams,
  ): Promise<PppoeOperacionEntity | null>;

  /**
   * Persiste los cambios realizados sobre un paso.
   *
   * Ejemplos:
   *
   * - iniciar();
   * - marcarExitoso();
   * - marcarFallido();
   * - omitir();
   */
  saveStep(
    params: GuardarPppoeOperacionPasoParams,
  ): Promise<PppoeOperacionPasoEntity>;

  /**
   * Busca únicamente la entidad principal.
   *
   * No carga pasos ni relaciones enriquecidas.
   *
   * Devuelve null cuando el registro no existe.
   * El caso de uso decide si debe lanzar NotFoundException.
   */
  findById(
    params: BuscarPppoeOperacionPorIdParams,
  ): Promise<PppoeOperacionEntity | null>;

  /**
   * Carga la operación y todos sus pasos técnicos.
   *
   * Se utiliza cuando un caso de uso necesita comparar:
   *
   * - estado de la operación;
   * - estados de los pasos;
   * - siguiente paso pendiente;
   * - pasos fallidos u omitidos.
   */
  findAggregateById(
    params: BuscarPppoeOperacionPorIdParams,
  ): Promise<PppoeOperacionAggregate | null>;

  /**
   * Busca un paso concreto y valida mediante la consulta
   * que pertenezca a la operación indicada.
   */
  findStepById(
    params: BuscarPppoeOperacionPasoPorIdParams,
  ): Promise<PppoeOperacionPasoEntity | null>;

  /**
   * Busca un paso mediante su orden dentro de la operación.
   *
   * Será útil para acciones como:
   *
   * iniciar el paso BUSCAR_SECRET;
   * completar el paso AGREGAR_SECRET;
   * omitir el paso AGREGAR_SECRET.
   */
  findStepByOrder(
    params: BuscarPppoeOperacionPasoPorOrdenParams,
  ): Promise<PppoeOperacionPasoEntity | null>;

  /**
   * Busca una operación mediante su clave de idempotencia.
   *
   * Si existe, el caso de uso puede devolver la operación
   * anterior en vez de crear un registro duplicado.
   */
  findByIdempotencyKey(
    params: BuscarPppoeOperacionPorIdempotenciaParams,
  ): Promise<PppoeOperacionEntity | null>;

  /**
   * Busca una operación que todavía esté en curso
   * sobre la cuenta PPPoE.
   *
   * Se utiliza para evitar ejecuciones concurrentes.
   */
  findRunningOperation(
    params: BuscarPppoeOperacionEnCursoParams,
  ): Promise<PppoeOperacionEntity | null>;

  /**
   * Busca el intento más reciente dentro de una cadena.
   *
   * Se utilizará para calcular:
   *
   * numeroIntento = intentoAnterior.numeroIntento + 1
   */
  findLatestAttempt(
    params: BuscarUltimoIntentoPppoeParams,
  ): Promise<PppoeOperacionEntity | null>;

  /**
   * Busca la última operación realizada sobre una cuenta.
   *
   * Será útil para revisar:
   *
   * - último aprovisionamiento;
   * - última suspensión;
   * - último intento fallido;
   * - último movimiento hacia MikroTik.
   */
  findLatestByAccount(
    params: BuscarUltimaOperacionCuentaPppoeParams,
  ): Promise<PppoeOperacionEntity | null>;
}
