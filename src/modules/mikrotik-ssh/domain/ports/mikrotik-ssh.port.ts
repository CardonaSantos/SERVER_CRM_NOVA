import { AbrirSesionMikrotikSshParams } from '../props/mikrotik-ssh-session.props';

import { MikrotikSshSessionPort } from './mikrotik-ssh-session.port';

/**
 * Token utilizado para inyectar la implementación
 * concreta del cliente SSH.
 */
export const MIKROTIK_SSH_PORT = Symbol('MIKROTIK_SSH_PORT');

/**
 * Punto de entrada público del módulo mikrotik-ssh.
 */
export interface MikrotikSshPort {
  /**
   * Abre y autentica una sesión SSH contra un router.
   *
   * La promesa solo se resuelve cuando la conexión está lista
   * para ejecutar comandos.
   */
  abrirSesion(
    params: AbrirSesionMikrotikSshParams,
  ): Promise<MikrotikSshSessionPort>;
}
