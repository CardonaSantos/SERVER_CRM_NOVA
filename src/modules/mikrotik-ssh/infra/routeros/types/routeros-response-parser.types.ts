import {
  ResultadoBaseMikrotikSsh,
  SesionActivaMikrotikSnapshot,
} from '../../../domain/results/mikrotik-ssh-common.result';

/**
 * Resultado interno de consultar las sesiones PPPoE
 * activas asociadas a un usuario.
 *
 * Esta información se utiliza antes y después de ejecutar:
 *
 * /ppp active remove [find name="..."]
 *
 * De esa forma la capa de sesión puede comprobar
 * el efecto remoto sin depender de contadores artificiales
 * impresos por un script RouterOS.
 */
export type BuscarSesionesActivasRouterOsResult = ResultadoBaseMikrotikSsh & {
  usuarioPppoe: string;

  sesiones: SesionActivaMikrotikSnapshot[];
};

/**
 * Resultado interno de enviar el comando:
 *
 * /ppp active remove [find name="..."]
 *
 * comandoEjecutado indica únicamente que RouterOS aceptó
 * el comando SSH sin reportar un error técnico.
 *
 * NO significa que la remoción haya sido confirmada.
 *
 * La confirmación se realiza posteriormente mediante
 * una nueva consulta de sesiones activas.
 */
export type RemoverSesionesActivasRouterOsResult = ResultadoBaseMikrotikSsh & {
  usuarioPppoe: string;

  comandoEjecutado: true;
};
