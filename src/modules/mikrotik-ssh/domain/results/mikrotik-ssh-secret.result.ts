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
 * Este método comprobará internamente cuántas sesiones
 * permanecen después de ejecutar la eliminación.
 */
export type RemoverSesionActivaMikrotikResult = ResultadoBaseMikrotikSsh & {
  usuarioPppoe: string;

  sesionesEncontradas: number;

  sesionesRemovidas: number;

  sesionesRestantes: number;

  sesiones: SesionActivaMikrotikSnapshot[];
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
