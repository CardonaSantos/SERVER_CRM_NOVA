import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';
import {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from '../enums/pppoe-operacion-operacion-paso.enums';
import { DomainJsonObject } from './domain-json.type';
import { CrearPppoeOperacionPasoInicialProps } from './pppoe-operacion-paso.props';

/**
 * Resultado general sanitizado de una operación.
 *
 * Ejemplo:
 *
 * {
 *   secretEncontrado: true,
 *   secretCreado: false,
 *   secretConfirmado: true,
 *   perfilCoincide: true,
 *   habilitado: true
 * }
 */
export type PppoeOperacionResultado = DomainJsonObject;

/**
 * Estado completo persistido de una operación PPPoE.
 *
 * No incluye relaciones pobladas.
 * Esas pertenecen a los read models.
 */
export type PppoeOperacionProps = {
  id: number | null;

  // ==========================================================
  // CONTEXTO
  // ==========================================================

  empresaId: number;

  cuentaPppoeId: number;

  mikrotikRouterId: number;

  perfilHomologacionId: number | null;

  instalacionId: number | null;

  desinstalacionId: number | null;

  // ==========================================================
  // REINTENTOS E IDEMPOTENCIA
  // ==========================================================

  /**
   * En un reintento apunta a la operación inicial
   * de la cadena.
   */
  reintentoDeId: number | null;

  numeroIntento: number;

  claveIdempotencia: string;

  // ==========================================================
  // CLASIFICACIÓN
  // ==========================================================

  tipo: TipoOperacionPppoe;

  origen: OrigenOperacionPppoe;

  canal: CanalOperacionPppoe;

  estado: EstadoOperacionPppoe;

  // ==========================================================
  // RESPONSABLE Y AUTORIZACIÓN
  // ==========================================================

  iniciadoPorId: number | null;

  reautenticadoPorId: number | null;

  requiereReautenticacion: boolean;

  reautenticacionExitosa: boolean | null;

  reautenticadoEn: Date | null;

  // ==========================================================
  // SNAPSHOTS NO SENSIBLES
  // ==========================================================

  usuarioPppoeSnapshot: string;

  codigoPerfilSnapshot: string | null;

  routerHostSnapshot: string | null;

  routerPuertoSnapshot: number | null;

  // ==========================================================
  // RESULTADO
  // ==========================================================

  motivo: string | null;

  resultado: PppoeOperacionResultado | null;

  errorCodigo: string | null;

  errorMensaje: string | null;

  // ==========================================================
  // TIEMPOS
  // ==========================================================

  iniciadoEn: Date | null;

  finalizadoEn: Date | null;

  canceladoEn: Date | null;

  duracionMs: number | null;

  creadoEn: Date;

  actualizadoEn: Date;
};

/**
 * Datos permitidos para crear una operación.
 *
 * No acepta estado, resultado, errores ni fechas finales.
 * La entidad establece todos esos valores.
 */
export type CrearPppoeOperacionProps = {
  empresaId: number;

  cuentaPppoeId: number;

  mikrotikRouterId: number;

  perfilHomologacionId?: number | null;

  instalacionId?: number | null;

  desinstalacionId?: number | null;

  /**
   * Null en el primer intento.
   *
   * En los reintentos debe señalar la operación
   * inicial de la cadena.
   */
  reintentoDeId?: number | null;

  /**
   * Default: 1.
   */
  numeroIntento?: number;

  claveIdempotencia: string;

  tipo: TipoOperacionPppoe;

  origen: OrigenOperacionPppoe;

  /**
   * Default: SSH.
   */
  canal?: CanalOperacionPppoe;

  /**
   * Puede ser null cuando la operación fue disparada
   * completamente por el sistema.
   */
  iniciadoPorId?: number | null;

  /**
   * Default definido según política de la operación.
   */
  requiereReautenticacion?: boolean;

  motivo?: string | null;

  usuarioPppoeSnapshot: string;

  codigoPerfilSnapshot?: string | null;

  /**
   * Aunque la tabla permita null, para operaciones
   * técnicas automáticas enviaremos ambos snapshots.
   */
  routerHostSnapshot: string;

  routerPuertoSnapshot: number;
};

/**
 * Contrato para crear operación y pasos iniciales
 * como una sola unidad lógica.
 *
 * Será utilizado por el repositorio con nested create
 * o por una transacción.
 */
export type CrearPppoeOperacionConPasosProps = {
  operacion: CrearPppoeOperacionProps;

  pasos: CrearPppoeOperacionPasoInicialProps[];
};
