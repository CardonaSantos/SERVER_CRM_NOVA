import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.types';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import {
  EstadoOperacionPppoe,
  PppoeOperacionResultado,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

export const PPPOE_PROVISIONAMIENTO = Symbol('PPPOE_PROVISIONAMIENTO');

/**
 * Fachada pública para ejecutar operaciones técnicas PPPoE.
 *
 * Los consumidores no conocen:
 *
 * - SSH;
 * - Prisma;
 * - credenciales cifradas;
 * - comandos RouterOS;
 * - pasos internos de PppoeOperacion.
 */
export interface PppoeProvisionamientoPort {
  /**
   * Crea o confirma el secret correspondiente
   * a una cuenta en prealta.
   */
  crearSecret(
    input: CrearSecretPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult>;

  /**
   * Habilita o confirma habilitado un secret existente.
   */
  activarSecret(
    input: ActivarSecretPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult>;

  /**
   * Reactiva manualmente una cuenta PPPoE suspendida.
   *
   * Reutiliza ACTIVAR_SECRET, pero no pertenece
   * al flujo de instalación.
   */
  reactivarServicio(
    input: ReactivarServicioPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult>;

  /**
   * Deshabilita el secret y elimina sesiones activas.
   *
   * Es una operación reversible mediante
   * reactivarServicio().
   */
  suspenderServicio(
    input: SuspenderServicioPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult>;

  /**
   * Deshabilita, desconecta y elimina definitivamente
   * el secret asociado a una desinstalación.
   *
   * Este método pertenece exclusivamente al contexto
   * ClienteDesinstalacion.
   */
  eliminarSecret(
    input: EliminarSecretPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult>;

  /**
   * Da de baja definitivamente una cuenta PPPoE
   * por decisión administrativa.
   *
   * No crea ni requiere:
   *
   * - ClienteInstalacion;
   * - ClienteDesinstalacion.
   *
   * Reutiliza técnicamente ELIMINAR_SECRET.
   *
   * La reautenticación del operador debe ocurrir
   * antes de invocar este puerto.
   */
  darDeBajaServicio(
    input: DarDeBajaServicioPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult>;

  /**
   * Crea un nuevo intento y vuelve a consultar
   * el estado real del router.
   */
  reintentarOperacion(
    input: ReintentarOperacionPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult>;
}

/**
 * Contexto del actor que origina una operación.
 *
 * No contiene contraseñas ni información de reautenticación.
 */
export type ActorProvisionamientoPppoeInput = {
  origen: OrigenOperacionPppoe;

  iniciadoPorId: number | null;

  operadorNombre?: string | null;

  ipOrigen?: string | null;

  userAgent?: string | null;
};

/**
 * Alias semántico utilizado por los casos de uso
 * que trabajan directamente con operaciones PPPoE.
 */
export type ActorOperacionPppoeInput = {
  origen: OrigenOperacionPppoe;

  iniciadoPorId: number | null;

  operadorNombre?: string | null;

  ipOrigen?: string | null;

  userAgent?: string | null;
};

/**
 * Datos comunes para crear y ejecutar una operación
 * técnica sobre una cuenta PPPoE.
 */
export type EjecutarProvisionamientoPppoeBaseInput = {
  empresaId: number;

  cuentaPppoeId: number;

  /**
   * Identifica una intención concreta.
   *
   * Repetir la misma clave no genera una segunda operación.
   */
  claveIdempotencia: string;

  actor: ActorOperacionPppoeInput;

  motivo?: string | null;
};

/**
 * Crea el secret correspondiente a una prealta.
 */
export type CrearSecretPppoeInput = EjecutarProvisionamientoPppoeBaseInput & {
  instalacionId: number;
};

/**
 * Habilita el secret después de completar
 * físicamente la instalación.
 */
export type ActivarSecretPppoeInput = EjecutarProvisionamientoPppoeBaseInput & {
  instalacionId: number;
};

/**
 * Reactiva manualmente una cuenta PPPoE suspendida.
 *
 * No pertenece al flujo de instalación.
 */
export type ReactivarServicioPppoeInput = {
  empresaId: number;

  cuentaPppoeId: number;

  claveIdempotencia: string;

  motivo: string;

  actor: ActorProvisionamientoPppoeInput;
};

/**
 * Deshabilita el secret y elimina sus sesiones activas.
 *
 * Puede originarse por cobranza, operador o sistema.
 */
export type SuspenderServicioPppoeInput = {
  empresaId: number;

  cuentaPppoeId: number;

  claveIdempotencia: string;

  operadorNombre?: string | null;

  /**
   * Obligatorio para conservar la razón administrativa
   * de la suspensión.
   */
  motivo: string;

  actor: ActorProvisionamientoPppoeInput;
};

/**
 * Elimina definitivamente el secret durante
 * una desinstalación autorizada.
 *
 * Este contrato conserva deliberadamente
 * desinstalacionId como obligatorio.
 *
 * Una eliminación administrativa que no pertenece
 * al flujo de ClienteDesinstalacion debe utilizar
 * DarDeBajaServicioPppoeInput.
 */
export type EliminarSecretPppoeInput =
  EjecutarProvisionamientoPppoeBaseInput & {
    /**
     * Desinstalación que origina la eliminación.
     */
    desinstalacionId: number;

    /**
     * Instalación relacionada, cuando se conserva
     * una referencia operativa.
     */
    instalacionId?: number | null;
  };

/**
 * Baja administrativa definitiva de una cuenta PPPoE.
 *
 * No pertenece a:
 *
 * - ClienteInstalacion;
 * - ClienteDesinstalacion.
 *
 * El operador ya debe haber sido reautenticado
 * por la fachada administrativa antes de que
 * este input llegue al motor de provisionamiento.
 *
 * El motivo es obligatorio porque representa
 * una acción destructiva e irreversible.
 */
export type DarDeBajaServicioPppoeInput = Omit<
  EjecutarProvisionamientoPppoeBaseInput,
  'motivo'
> & {
  motivo: string;
};

/**
 * Genera y ejecuta un intento nuevo sobre una operación
 * previamente FALLIDA o PARCIAL.
 */
export type ReintentarOperacionPppoeInput = {
  empresaId: number;

  operacionId: number;

  /**
   * La clave debe ser distinta a la utilizada
   * por los intentos anteriores.
   */
  claveIdempotencia: string;

  actor: ActorOperacionPppoeInput;

  motivo?: string | null;
};

/**
 * Resultado público de una ejecución PPPoE.
 *
 * No expone credenciales, comandos completos,
 * stdout, stderr ni material criptográfico.
 */
export type EjecutarOperacionPppoeResult = {
  operacionId: number;

  cuentaPppoeId: number;

  tipo: TipoOperacionPppoe;

  estadoOperacion: EstadoOperacionPppoe;

  estadoCuenta: EstadoCuentaPppoe | null;

  numeroIntento: number;

  reintentable: boolean;

  resultado: PppoeOperacionResultado | null;

  errorCodigo: string | null;

  errorMensaje: string | null;
};
