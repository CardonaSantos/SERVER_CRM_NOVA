import {
  AutenticacionMikrotikSsh,
  VerificacionHostMikrotikSsh,
} from './mikrotik-ssh-auth.props';

/**
 * Datos necesarios para abrir una sesión SSH.
 *
 * Los timeouts y límites se obtienen de la configuración
 * interna del módulo.
 */
export type AbrirSesionMikrotikSshParams = {
  host: string;

  port: number;

  username: string;

  autenticacion: AutenticacionMikrotikSsh;

  verificacionHost: VerificacionHostMikrotikSsh;
};

/**
 * Información segura de una sesión abierta.
 */
export type SesionMikrotikSshInfo = {
  host: string;

  port: number;

  username: string;

  conectadoEn: Date;

  duracionConexionMs: number;
};
