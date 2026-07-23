import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';
import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../enums/pppoe-auditoria-enums';

/**
 * Valores permitidos dentro del campo JSON `datos`.
 *
 * El dominio no depende de Prisma.JsonValue.
 */
export type PppoeAuditoriaJsonValue =
  | string
  | number
  | boolean
  | null
  | PppoeAuditoriaJsonValue[]
  | {
      [key: string]: PppoeAuditoriaJsonValue;
    };

/**
 * Estructura esperada para datos adicionales de auditoría.
 *
 * Se mantiene como objeto para facilitar búsquedas,
 * lectura y estandarización de la bitácora.
 */
export type DatosAuditoriaPppoe = Record<string, PppoeAuditoriaJsonValue>;

/**
 * Propiedades requeridas para crear un registro de auditoría.
 *
 * Solamente son obligatorios:
 * - empresa
 * - origen
 * - acción
 * - descripción
 *
 * Las referencias restantes dependen del flujo auditado.
 */
export type CrearPppoeAuditoriaEntityProps = {
  empresaId: number;

  /*
   * Contexto comercial y PPPoE.
   */
  clienteId?: number | null;
  accesoInternetId?: number | null;
  cuentaPppoeId?: number | null;
  perfilHomologacionId?: number | null;

  /*
   * Contexto operativo.
   */
  instalacionId?: number | null;
  desinstalacionId?: number | null;
  operacionId?: number | null;

  /*
   * Operador responsable.
   *
   * Puede ser null cuando el origen sea:
   * - SISTEMA
   * - COBRANZA_AUTOMATICA
   */
  operadorId?: number | null;

  origen: OrigenOperacionPppoe;
  accion: AccionAuditoriaPppoe;

  descripcion: string;

  /*
   * Transición de estado de la cuenta PPPoE.
   *
   * Ambos pueden ser null cuando la acción no modifica
   * el estado de ClientePppoeCuenta.
   */
  estadoCuentaAnterior?: EstadoCuentaPppoe | null;
  estadoCuentaNuevo?: EstadoCuentaPppoe | null;

  /*
   * Snapshots históricos.
   *
   * Se almacenan para conservar información legible
   * aunque posteriormente cambien las entidades relacionadas.
   */
  usuarioPppoeSnapshot?: string | null;
  perfilCodigoSnapshot?: string | null;
  operadorNombreSnapshot?: string | null;

  /*
   * Información adicional no sensible.
   */
  datos?: DatosAuditoriaPppoe | null;

  /*
   * Contexto de la solicitud HTTP.
   *
   * Puede ser null en cron jobs, eventos internos
   * y operaciones automáticas.
   */
  ipOrigen?: string | null;
  userAgent?: string | null;

  /**
   * Permite controlar la fecha en pruebas o conservar
   * exactamente el momento en que ocurrió el evento.
   *
   * Si se omite, la entidad utilizará la fecha actual.
   */
  creadoEn?: Date;
};

/**
 * Estado completo de una auditoría PPPoE.
 *
 * Esta estructura será utilizada por:
 * - hydrate()
 * - toPrimitives()
 * - mapper Prisma
 * - repositorio
 */
export type PppoeAuditoriaEntityProps = {
  id: number | null;

  empresaId: number;

  clienteId: number | null;
  accesoInternetId: number | null;
  cuentaPppoeId: number | null;
  perfilHomologacionId: number | null;

  instalacionId: number | null;
  desinstalacionId: number | null;
  operacionId: number | null;

  operadorId: number | null;

  origen: OrigenOperacionPppoe;
  accion: AccionAuditoriaPppoe;

  descripcion: string;

  estadoCuentaAnterior: EstadoCuentaPppoe | null;
  estadoCuentaNuevo: EstadoCuentaPppoe | null;

  usuarioPppoeSnapshot: string | null;
  perfilCodigoSnapshot: string | null;
  operadorNombreSnapshot: string | null;

  datos: DatosAuditoriaPppoe | null;

  ipOrigen: string | null;
  userAgent: string | null;

  creadoEn: Date;
};

// AUXILIARES

export type RegistrarEventoCuentaPppoeProps = Omit<
  CrearPppoeAuditoriaEntityProps,
  'cuentaPppoeId'
> & {
  cuentaPppoeId: number;
};

export type RegistrarTransicionCuentaPppoeProps = Omit<
  RegistrarEventoCuentaPppoeProps,
  'estadoCuentaAnterior' | 'estadoCuentaNuevo'
> & {
  /**
   * Puede ser null cuando se registra el primer estado
   * de la cuenta, por ejemplo durante la prealta.
   */
  estadoCuentaAnterior: EstadoCuentaPppoe | null;

  estadoCuentaNuevo: EstadoCuentaPppoe;
};

export type RegistrarEventoOperacionPppoeProps = Omit<
  CrearPppoeAuditoriaEntityProps,
  'operacionId'
> & {
  operacionId: number;
};

export type RegistrarEventoInstalacionPppoeProps = Omit<
  CrearPppoeAuditoriaEntityProps,
  'instalacionId'
> & {
  instalacionId: number;
};

export type RegistrarEventoDesinstalacionPppoeProps = Omit<
  CrearPppoeAuditoriaEntityProps,
  'desinstalacionId'
> & {
  desinstalacionId: number;
};
