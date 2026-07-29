import {
  ActivarSecretPppoeInput,
  CrearSecretPppoeInput,
  EjecutarOperacionPppoeResult,
  EliminarSecretPppoeInput,
  ReintentarOperacionPppoeInput,
  SuspenderServicioPppoeInput,
} from '../props/pppoe-provisionamiento.props';

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
   * Deshabilita el secret y elimina sesiones activas.
   */
  suspenderServicio(
    input: SuspenderServicioPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult>;

  /**
   * Deshabilita, desconecta y elimina definitivamente
   * el secret asociado a una desinstalación.
   */
  eliminarSecret(
    input: EliminarSecretPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult>;

  /**
   * Crea un nuevo intento y vuelve a consultar
   * el estado real del router.
   */
  reintentarOperacion(
    input: ReintentarOperacionPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult>;
}
