import {
  ResultadoBaseMikrotikSsh,
  SesionActivaMikrotikSnapshot,
} from '../../../domain/results/mikrotik-ssh-common.result';

/**
 * Resultado interno de buscar sesiones activas.
 */
export type BuscarSesionesActivasRouterOsResult = ResultadoBaseMikrotikSsh & {
  usuarioPppoe: string;

  sesiones: SesionActivaMikrotikSnapshot[];
};

/**
 * Resultado interno del comando de remoción.
 *
 * La sesión SSH realizará otra consulta después
 * para confirmar cuántas sesiones permanecen.
 */
export type RemoverSesionesActivasRouterOsResult = ResultadoBaseMikrotikSsh & {
  usuarioPppoe: string;

  sesionesRemovidasReportadas: number;
};
