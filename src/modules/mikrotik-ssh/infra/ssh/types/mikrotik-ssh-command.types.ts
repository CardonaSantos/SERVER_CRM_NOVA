import {
  EfectoRemotoMikrotik,
  FaseFalloMikrotikSsh,
} from '../../../domain/enums/mikrotik-ssh.enums';

/**
 * Fases admitidas durante la ejecución de comandos.
 */
export type FaseComandoMikrotikSsh =
  | FaseFalloMikrotikSsh.EJECUCION
  | FaseFalloMikrotikSsh.CONFIRMACION;

/**
 * Datos internos para ejecutar una instrucción RouterOS.
 *
 * Este tipo pertenece a infraestructura y no se exporta
 * desde MikrotikSshModule.
 */

export type EjecutarComandoMikrotikSshParams = {
  comando: string;

  comandoSanitizado: string;

  fase: FaseComandoMikrotikSsh;

  efectoRemotoEnFallo: EfectoRemotoMikrotik;

  timeoutMs?: number;

  maxOutputBytes?: number;
};

/**
 * Resultado técnico interno de ejecutar un comando.
 *
 * stdout y stderr nunca deben salir de infraestructura.
 */
export type ResultadoEjecucionComandoMikrotikSsh = {
  stdout: string;

  stderr: string;

  exitCode: number | null;

  signal: string | null;

  duracionMs: number;

  comandoSanitizado: string;

  outputTruncated: false;
};
