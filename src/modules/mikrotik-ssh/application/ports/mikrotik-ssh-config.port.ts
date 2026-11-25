import { ConfiguracionMikrotikSsh } from '../../domain/props/mikrotik-ssh-config.props';

/**
 * Configuración de las conexiones SSH a los routers (tiempos, reintentos,
 * huellas de host…). La arma `infra/config/mikrotik-ssh-config.provider.ts`
 * desde variables de entorno; la consumen los adaptadores SSH.
 */
export const MIKROTIK_SSH_CONFIG = Symbol('MIKROTIK_SSH_CONFIG');

export type MikrotikSshConfigPort = ConfiguracionMikrotikSsh;
