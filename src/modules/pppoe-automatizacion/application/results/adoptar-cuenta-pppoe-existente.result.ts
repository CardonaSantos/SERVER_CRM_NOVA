import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

/**
 * Resultado seguro de adoptar una cuenta PPPoE
 * que ya existía previamente en MikroTik.
 *
 * Nunca contiene contraseña ni material criptográfico.
 */
export type AdoptarCuentaPppoeExistenteResult = {
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

  /**
   * Indica si la contraseña adoptada utiliza
   * la nomenclatura actual de NOVA.
   *
   * false NO invalida la adopción.
   */
  cumpleFormatoNova: boolean;

  advertencias: string[];
};
