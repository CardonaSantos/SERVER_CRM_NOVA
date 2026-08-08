/**
 * Datos necesarios para localizar un secret PPPoE.
 *
 * El usuario PPPoE corresponde al valor utilizado
 * como columna maestra `name` dentro de RouterOS.
 */
export type BuscarSecretMikrotikParams = {
  usuarioPppoe: string;
};

/**
 * Datos necesarios para crear un secret PPPoE.
 *
 * Requerimiento PPPoE v3:
 *
 * /ppp secret add
 *   name="{id_cliente}"
 *   password="{password}"
 *   profile="{perfil}"
 *   service="pppoe"
 *
 * `service` no forma parte del contrato porque su valor
 * es fijo y pertenece al CommandBuilder.
 *
 * Tampoco se reciben:
 *
 * - disabled;
 * - comment.
 *
 * El requerimiento establece que el secret creado durante
 * EN INSTALACIÓN debe quedar habilitado.
 */
export type CrearSecretMikrotikParams = {
  /**
   * Valor utilizado como `name` del secret.
   */
  usuarioPppoe: string;

  /**
   * Contraseña PPPoE temporal disponible únicamente
   * durante la ejecución.
   *
   * Nunca debe registrarse en:
   *
   * - comandoSanitizado;
   * - operaciones;
   * - pasos;
   * - auditorías;
   * - logs de aplicación.
   */
  passwordPppoe: string;

  /**
   * Código exacto del Profile homologado en RouterOS.
   */
  codigoPerfil: string;
};

/**
 * Datos comunes para ejecutar operaciones sobre
 * un secret existente:
 *
 * /ppp secret enable [find name="..."]
 * /ppp secret disable [find name="..."]
 * /ppp secret remove [find name="..."]
 */
export type GestionarSecretMikrotikParams = {
  usuarioPppoe: string;
};

/**
 * Datos necesarios para remover las sesiones PPPoE
 * activas correspondientes al usuario:
 *
 * /ppp active remove [find name="..."]
 */
export type RemoverSesionActivaMikrotikParams = {
  usuarioPppoe: string;
};

/**
 * Valores esperados durante una comprobación posterior
 * del estado de un secret.
 *
 * Estas propiedades NO construyen el comando modificador.
 *
 * Se utilizan únicamente después de la mutación para
 * verificar qué estado posee realmente RouterOS.
 */
export type ConfirmarSecretMikrotikParams =
  | {
      /**
       * El secret debe existir después de la operación.
       *
       * Aplica a:
       *
       * - creación;
       * - activación;
       * - suspensión.
       */
      debeExistir: true;

      usuarioPppoe: string;

      /**
       * Cuando se proporciona, la consulta posterior
       * debe devolver exactamente este Profile.
       */
      codigoPerfilEsperado?: string | null;

      /**
       * Estado `disabled` que esperamos encontrar
       * durante la consulta de confirmación.
       *
       * false = habilitado
       * true  = deshabilitado
       *
       * Este valor pertenece exclusivamente a la
       * confirmación y nunca al comando de creación.
       */
      deshabilitadoEsperado?: boolean | null;
    }
  | {
      /**
       * Utilizado después de eliminar definitivamente
       * un secret.
       */
      debeExistir: false;

      usuarioPppoe: string;

      /**
       * No tiene sentido comprobar Profile o disabled
       * cuando el resultado esperado es la inexistencia
       * del secret.
       */
      codigoPerfilEsperado?: never;

      deshabilitadoEsperado?: never;
    };

// /**
//  * Datos necesarios para localizar un secret PPPoE.
//  */
// export type BuscarSecretMikrotikParams = {
//   usuarioPppoe: string;
// };

// /**
//  * Datos necesarios para crear un secret PPPoE.
//  */
// export type CrearSecretMikrotikParams = {
//   usuarioPppoe: string;

//   /**
//    * Contraseña temporal en memoria.
//    *
//    * Nunca debe registrarse en comandos sanitizados,
//    * operaciones, pasos ni auditorías.
//    */
//   passwordPppoe: string;

//   codigoPerfil: string;

//   /**
//    * Evita depender de un comportamiento implícito.
//    */
//   deshabilitado: boolean;

//   comentario?: string | null;
// };

// /**
//  * Datos comunes para habilitar, deshabilitar
//  * o eliminar un secret.
//  */
// export type GestionarSecretMikrotikParams = {
//   usuarioPppoe: string;
// };

// /**
//  * Datos necesarios para remover sesiones activas
//  * correspondientes al usuario PPPoE.
//  */
// export type RemoverSesionActivaMikrotikParams = {
//   usuarioPppoe: string;
// };

// /**
//  * Valores esperados durante la confirmación.
//  */
// export type ConfirmarSecretMikrotikParams =
//   | {
//       /**
//        * El secret debe existir.
//        */
//       debeExistir: true;

//       usuarioPppoe: string;

//       codigoPerfilEsperado?: string | null;

//       deshabilitadoEsperado?: boolean | null;
//     }
//   | {
//       /**
//        * Utilizado después de ELIMINAR_SECRET.
//        */
//       debeExistir: false;

//       usuarioPppoe: string;

//       codigoPerfilEsperado?: never;

//       deshabilitadoEsperado?: never;
//     };
