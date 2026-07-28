import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import { PppoeOperacionResultado } from 'src/modules/pppoe-operacion/domain/props/pppoe-operacion.props';

/**
 * Contexto del actor que origina una operación.
 *
 * No contiene contraseñas ni información de reautenticación.
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
 * Deshabilita el secret y elimina sus sesiones activas.
 *
 * Puede originarse por cobranza, operador o sistema.
 */
export type SuspenderServicioPppoeInput =
  EjecutarProvisionamientoPppoeBaseInput & {
    instalacionId?: number | null;
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

  estadoCuenta: EstadoCuentaPppoe;

  numeroIntento: number;

  reintentable: boolean;

  resultado: PppoeOperacionResultado | null;

  errorCodigo: string | null;

  errorMensaje: string | null;
};
