import {
  PppoeOperacionDetalle,
  PppoeOperacionFindManyFilters,
  PppoeOperacionPaginatedResult,
} from '../read-models/pppoe-operacion.read-model';

/**
 * ============================================================
 * TOKEN DE INYECCIÓN
 * ============================================================
 */

/**
 * Token utilizado para inyectar el repositorio
 * de consultas enriquecidas de operaciones PPPoE.
 */
export const PPPOE_OPERACION_QUERY = Symbol('PPPOE_OPERACION_QUERY');

/**
 * ============================================================
 * PARÁMETROS DEL DETALLE
 * ============================================================
 */

/**
 * Parámetros utilizados para consultar el detalle completo
 * de una operación dentro de una empresa.
 */
export type BuscarPppoeOperacionDetalleParams = {
  empresaId: number;

  operacionId: number;
};

/**
 * ============================================================
 * PUERTO DE CONSULTAS
 * ============================================================
 */

/**
 * Puerto de lectura para consultas administrativas y UI.
 *
 * Este puerto devuelve read models enriquecidos con relaciones.
 * No devuelve entidades de dominio.
 */
export interface PppoeOperacionQueryPort {
  /**
   * Devuelve operaciones paginadas desde servidor.
   *
   * Permite filtrar, entre otros, por:
   *
   * - instalación;
   * - desinstalación;
   * - cuenta PPPoE;
   * - router MikroTik;
   * - operador;
   * - tipo;
   * - estado;
   * - canal;
   * - fechas.
   *
   * Formato:
   *
   * {
   *   data: PppoeOperacionListItem[];
   *   meta: {
   *     total: number;
   *     page: number;
   *     limit: number;
   *     totalPages: number;
   *   };
   * }
   */
  findPaginated(
    filters: PppoeOperacionFindManyFilters,
  ): Promise<PppoeOperacionPaginatedResult>;

  /**
   * Devuelve el detalle enriquecido de una operación.
   *
   * Incluye:
   *
   * - empresa;
   * - cuenta PPPoE;
   * - cliente y acceso;
   * - router;
   * - perfil homologado;
   * - instalación o desinstalación;
   * - operador que inició;
   * - operador que reautenticó;
   * - pasos técnicos;
   * - cadena de reintentos;
   * - conteos.
   *
   * No incluye contraseñas ni material criptográfico.
   */
  findDetailById(
    params: BuscarPppoeOperacionDetalleParams,
  ): Promise<PppoeOperacionDetalle | null>;
}
