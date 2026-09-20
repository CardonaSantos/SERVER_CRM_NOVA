import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

import { PppoeOperacionEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion.entity';

/**
 * Token interno para registrar los eventos principales
 * de una operación PPPoE.
 */
export const PPPOE_OPERACION_AUDITORIA = Symbol('PPPOE_OPERACION_AUDITORIA');

/**
 * Contexto opcional del actor que originó la operación.
 *
 * No contiene contraseñas ni datos de reautenticación.
 */
export type ActorAuditoriaOperacionPppoe = {
  operadorId?: number | null;

  operadorNombre?: string | null;

  ipOrigen?: string | null;

  userAgent?: string | null;
};

/**
 * Datos comunes de un evento de operación.
 */
export type RegistrarAuditoriaOperacionPppoeParams = {
  operacion: PppoeOperacionEntity;

  actor?: ActorAuditoriaOperacionPppoe | null;

  estadoCuentaAnterior?: EstadoCuentaPppoe | null;

  estadoCuentaNuevo?: EstadoCuentaPppoe | null;

  fecha?: Date;
};

/**
 * Datos necesarios para auditar un nuevo intento.
 */
export type RegistrarAuditoriaReintentoPppoeParams =
  RegistrarAuditoriaOperacionPppoeParams & {
    operacionAnteriorId: number;
  };

/**
 * Datos necesarios para auditar la recuperación
 * de una operación abandonada.
 */
export type RegistrarAuditoriaRecuperacionPppoeParams =
  RegistrarAuditoriaOperacionPppoeParams & {
    recuperacion:
      | 'SINCRONIZACION_LOCAL_COMPLETADA'
      | 'CERRADA_COMO_FALLIDA'
      | 'CERRADA_COMO_PARCIAL';
  };

/**
 * Puerto semántico utilizado por los orquestadores.
 *
 * La auditoría no debe modificar el resultado principal
 * de una operación remota ya ejecutada.
 */
export interface PppoeOperacionAuditoriaPort {
  registrarCreada(
    params: RegistrarAuditoriaOperacionPppoeParams,
  ): Promise<void>;

  registrarIniciada(
    params: RegistrarAuditoriaOperacionPppoeParams,
  ): Promise<void>;

  registrarFinalizada(
    params: RegistrarAuditoriaOperacionPppoeParams,
  ): Promise<void>;

  registrarReintentada(
    params: RegistrarAuditoriaReintentoPppoeParams,
  ): Promise<void>;

  registrarRecuperada(
    params: RegistrarAuditoriaRecuperacionPppoeParams,
  ): Promise<void>;
}
