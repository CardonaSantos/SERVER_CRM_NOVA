import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';
import { ModoAccesoInstalacion } from '../application/dto/iniciar-acceso-types.dto';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';
import { ClienteInstalacionDetalle } from '../domain/ports/cliente-instalacion.repository.port';

/**
 * Resultado funcional del intento de preparar
 * la cuenta PPPoE durante la creación de la instalación.
 */
export enum EstadoResultadoPrealtaPppoe {
  /**
   * El acceso no pertenece al flujo automático
   * FIBRA_GPON + PPPOE.
   */
  NO_APLICA = 'NO_APLICA',

  /**
   * Se creó una cuenta PPPoE nueva.
   */
  CREADA = 'CREADA',

  /**
   * El acceso ya tenía una cuenta PPPoE válida.
   *
   * La operación fue idempotente y no duplicó
   * la contraseña, la cuenta ni la prealta.
   */
  YA_EXISTIA = 'YA_EXISTIA',

  /**
   * La instalación y el acceso fueron creados,
   * pero la prealta PPPoE no pudo completarse.
   */
  FALLIDA = 'FALLIDA',
}

/**
 * Información del acceso que quedó relacionado
 * con la instalación.
 */
export type ClienteInstalacionAccesoResult = {
  accesoInternetId: number;

  modo: ModoAccesoInstalacion;

  tecnologia: TecnologiaAccesoInternet;

  metodoAutenticacion: MetodoAutenticacionInternet;

  /**
   * Solo estará disponible durante la creación de
   * un acceso nuevo cuando haya sido enviado en el DTO.
   *
   * Actualmente no se persiste en ClienteAccesoInternet.
   */
  mikrotikRouterId: number | null;
};

/**
 * La prealta no corresponde al acceso procesado.
 */
export type PrealtaPppoeNoAplicaResult = {
  aplica: false;

  estado: EstadoResultadoPrealtaPppoe.NO_APLICA;

  cuentaPppoeId: null;

  perfilHomologacionId: null;

  usuario: null;

  estadoCuenta: null;

  generadoEn: null;

  mensaje: null;

  reintentable: false;
};

/**
 * La prealta fue creada o ya existía.
 */
export type PrealtaPppoeExitosaResult = {
  aplica: true;

  estado:
    | EstadoResultadoPrealtaPppoe.CREADA
    | EstadoResultadoPrealtaPppoe.YA_EXISTIA;

  cuentaPppoeId: number;

  perfilHomologacionId: number;

  usuario: string;

  estadoCuenta: EstadoCuentaPppoe;

  generadoEn: Date;

  mensaje: null;

  reintentable: false;
};

/**
 * La prealta aplicaba, pero ocurrió un error.
 *
 * La instalación y el acceso permanecen creados.
 */
export type PrealtaPppoeFallidaResult = {
  aplica: true;

  estado: EstadoResultadoPrealtaPppoe.FALLIDA;

  /**
   * En esta primera implementación se deja en null
   * porque el error puede ocurrir antes o después
   * de intentar crear la cuenta.
   */
  cuentaPppoeId: null;

  perfilHomologacionId: null;

  usuario: null;

  estadoCuenta: null;

  generadoEn: null;

  /**
   * Debe contener un mensaje seguro para la interfaz.
   * No debe exponer stack traces, contraseñas ni datos
   * internos de cifrado.
   */
  mensaje: string;

  /**
   * Permitirá que posteriormente la UI muestre
   * la acción "Dar prealta".
   */
  reintentable: true;
};

export type PrealtaPppoeInstalacionResult =
  | PrealtaPppoeNoAplicaResult
  | PrealtaPppoeExitosaResult
  | PrealtaPppoeFallidaResult;

/**
 * Resultado final de CrearClienteInstalacionUseCase.
 */
export type CrearClienteInstalacionResult = {
  /**
   * Información principal de la instalación creada.
   */
  detalle: ClienteInstalacionDetalle;

  /**
   * Acceso creado o vinculado a la instalación.
   */
  acceso: ClienteInstalacionAccesoResult;

  /**
   * Resultado del primer flujo PPPoE.
   */
  prealtaPppoe: PrealtaPppoeInstalacionResult;
};
