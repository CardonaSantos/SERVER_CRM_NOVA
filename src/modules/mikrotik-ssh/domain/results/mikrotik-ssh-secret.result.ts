import {
  ResultadoBaseMikrotikSsh,
  SecretMikrotikSnapshot,
  SesionActivaMikrotikSnapshot,
} from './mikrotik-ssh-common.result';

/**
 * Resultado de buscar un secret PPPoE.
 */
export type BuscarSecretMikrotikResult = ResultadoBaseMikrotikSsh & {
  usuarioPppoe: string;

  encontrado: boolean;

  secret: SecretMikrotikSnapshot | null;
};

/**
 * Resultado de enviar el comando de creación.
 *
 * comandoEjecutado no significa que el cambio ya haya
 * sido confirmado. La confirmación se realiza después.
 */
export type CrearSecretMikrotikResult = ResultadoBaseMikrotikSsh & {
  usuarioPppoe: string;

  codigoPerfil: string;

  comandoEjecutado: true;
};

/**
 * Acciones admitidas sobre un secret existente.
 */
export type AccionGestionSecretMikrotik =
  | 'HABILITAR'
  | 'DESHABILITAR'
  | 'ELIMINAR';

/**
 * Resultado de habilitar, deshabilitar o eliminar un secret.
 *
 * La confirmación definitiva pertenece al paso
 * CONFIRMAR_SECRET.
 */
export type GestionarSecretMikrotikResult = ResultadoBaseMikrotikSsh & {
  usuarioPppoe: string;

  accion: AccionGestionSecretMikrotik;

  comandoEjecutado: true;
};

/**
 * Resultado de remover sesiones PPPoE activas.
 *
 * El comando modificador:
 *
 * /ppp active remove [find name="..."]
 *
 * se ejecuta una sola vez.
 *
 * Después se realizan exclusivamente consultas de lectura
 * hasta confirmar que RouterOS ya no reporta sesiones activas
 * para el usuario o hasta agotar la ventana de confirmación.
 */
export type RemoverSesionActivaMikrotikResult = ResultadoBaseMikrotikSsh & {
  usuarioPppoe: string;

  /**
   * Cantidad de sesiones observadas antes de ejecutar
   * el comando de remoción.
   */
  sesionesEncontradas: number;

  /**
   * Diferencia entre las sesiones observadas inicialmente
   * y las que permanecieron al finalizar la confirmación.
   */
  sesionesRemovidas: number;

  /**
   * Cantidad final observada.
   *
   * Un resultado satisfactorio de este método siempre
   * devuelve cero.
   */
  sesionesRestantes: number;

  /**
   * Snapshot de las sesiones que existían antes de ejecutar
   * la remoción.
   *
   * Se conserva para diagnóstico y auditoría.
   */
  sesiones: SesionActivaMikrotikSnapshot[];

  /**
   * Número total de consultas realizadas después del
   * comando remove para confirmar la desaparición.
   *
   * Incluye la primera consulta inmediata.
   *
   * Ejemplo:
   *
   * 1 = RouterOS reflejó el cambio inmediatamente.
   * 3 = fueron necesarias tres comprobaciones.
   */
  confirmacionIntentos: number;

  /**
   * Tiempo total dedicado a la fase de confirmación,
   * incluyendo:
   *
   * - consultas SSH;
   * - esperas de backoff.
   *
   * No incluye la consulta anterior a la remoción.
   */
  confirmacionDuracionMs: number;
};

/**
 * Resultado de confirmar el estado final de un secret.
 *
 * Solo se devuelve cuando la comprobación fue satisfactoria.
 * Cuando no coincide, el adaptador lanza MikrotikSshError.
 */
export type ConfirmarSecretMikrotikResult = ResultadoBaseMikrotikSsh & {
  usuarioPppoe: string;

  confirmado: true;

  debeExistir: boolean;

  secretActual: SecretMikrotikSnapshot | null;
};
