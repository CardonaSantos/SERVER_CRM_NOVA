import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

import { SecretoPppoeProtegido } from 'src/modules/pppoe-credentials/application/ports/pppoe-secret-cipher.port';

/**
 * Token de infraestructura encargado de persistir
 * una adopción PPPoE completa dentro de una única
 * transacción de base de datos.
 */
export const PPPOE_ADOPCION_PERSISTENCE_PORT = Symbol(
  'PPPOE_ADOPCION_PERSISTENCE_PORT',
);

/**
 * Una cuenta adoptada solamente puede reflejar
 * uno de estos dos estados remotos consistentes.
 */
export type EstadoPersistenciaAdopcionPppoe =
  | {
      estadoCuenta: EstadoCuentaPppoe.ACTIVA;

      estadoAcceso: EstadoAccesoInternet.ACTIVO;
    }
  | {
      estadoCuenta: EstadoCuentaPppoe.SUSPENDIDA;

      estadoAcceso: EstadoAccesoInternet.SUSPENDIDO;
    };

export type PersistirAdopcionPppoeParams = {
  empresaId: number;

  clienteId: number;

  servicioInternetId: number;

  perfilHomologacionId: number;

  mikrotikRouterId: number;

  /**
   * Usuario exacto que ya existe en MikroTik.
   *
   * Es libre y no se deriva del clienteId.
   */
  usuarioPppoe: string;

  /**
   * Material cifrado producido por
   * PppoeSecretCipherPort.
   *
   * La contraseña plana nunca llega a
   * este puerto.
   */
  secretoProtegido: SecretoPppoeProtegido;

  estado: EstadoPersistenciaAdopcionPppoe;

  /**
   * Usuario del CRM que ejecutó la adopción.
   */
  adoptadoPorId: number;

  /**
   * Momento de la verificación final y adopción.
   */
  fechaAdopcion: Date;

  /**
   * Datos seguros que podrán quedar registrados
   * en la auditoría.
   */
  auditoria: {
    codigoPerfil: string;

    servicioRemoto: string | null;

    /**
     * Solo describe si la contraseña verificada
     * utiliza la nomenclatura actual.
     *
     * Nunca contiene la contraseña.
     */
    cumpleFormatoNova: boolean;
  };
};

export type PersistirAdopcionPppoeResult = {
  empresaId: number;

  clienteId: number;

  accesoInternetId: number;

  cuentaPppoeId: number;

  perfilHomologacionId: number;

  mikrotikRouterId: number;

  servicioInternetId: number;

  usuarioPppoe: string;

  estadoCuenta: EstadoCuentaPppoe;

  estadoAcceso: EstadoAccesoInternet;

  adoptadoPorId: number;

  adoptadoEn: Date;

  auditoriaId: number;
};

/**
 * Persistencia transaccional de una adopción.
 *
 * La implementación deberá garantizar:
 *
 * BEGIN
 *
 *   1. crear ClienteAccesoInternet
 *   2. crear ClientePppoeCuenta
 *   3. crear PppoeAuditoria
 *
 * COMMIT
 *
 * Si cualquiera falla:
 *
 * ROLLBACK
 *
 * Nunca debe quedar solamente el acceso o solamente
 * la cuenta.
 */
export interface PppoeAdopcionPersistencePort {
  persistir(
    params: PersistirAdopcionPppoeParams,
  ): Promise<PersistirAdopcionPppoeResult>;
}
