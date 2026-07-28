/**
 * Datos necesarios para localizar un secret PPPoE.
 */
export type BuscarSecretMikrotikParams = {
  usuarioPppoe: string;
};

/**
 * Datos necesarios para crear un secret PPPoE.
 */
export type CrearSecretMikrotikParams = {
  usuarioPppoe: string;

  /**
   * Contraseña temporal en memoria.
   *
   * Nunca debe registrarse en comandos sanitizados,
   * operaciones, pasos ni auditorías.
   */
  passwordPppoe: string;

  codigoPerfil: string;

  /**
   * Evita depender de un comportamiento implícito.
   */
  deshabilitado: boolean;

  comentario?: string | null;
};

/**
 * Datos comunes para habilitar, deshabilitar
 * o eliminar un secret.
 */
export type GestionarSecretMikrotikParams = {
  usuarioPppoe: string;
};

/**
 * Datos necesarios para remover sesiones activas
 * correspondientes al usuario PPPoE.
 */
export type RemoverSesionActivaMikrotikParams = {
  usuarioPppoe: string;
};

/**
 * Valores esperados durante la confirmación.
 */
export type ConfirmarSecretMikrotikParams =
  | {
      /**
       * El secret debe existir.
       */
      debeExistir: true;

      usuarioPppoe: string;

      codigoPerfilEsperado?: string | null;

      deshabilitadoEsperado?: boolean | null;
    }
  | {
      /**
       * Utilizado después de ELIMINAR_SECRET.
       */
      debeExistir: false;

      usuarioPppoe: string;

      codigoPerfilEsperado?: never;

      deshabilitadoEsperado?: never;
    };
