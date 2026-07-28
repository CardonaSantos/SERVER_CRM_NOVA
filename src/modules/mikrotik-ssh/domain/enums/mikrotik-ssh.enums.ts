/**
 * Métodos admitidos para autenticarse contra MikroTik.
 */
export enum MetodoAutenticacionMikrotikSsh {
  PASSWORD = 'PASSWORD',

  PRIVATE_KEY = 'PRIVATE_KEY',
}

/**
 * Fase en la que ocurrió un error SSH.
 */
export enum FaseFalloMikrotikSsh {
  CONFIGURACION = 'CONFIGURACION',

  CONEXION = 'CONEXION',

  HANDSHAKE = 'HANDSHAKE',

  AUTENTICACION = 'AUTENTICACION',

  APERTURA_CANAL = 'APERTURA_CANAL',

  EJECUCION = 'EJECUCION',

  CONFIRMACION = 'CONFIRMACION',

  CIERRE = 'CIERRE',
}

/**
 * Posible efecto producido sobre el router.
 *
 * Permite decidir si una operación debe finalizar
 * como FALLIDA o PARCIAL.
 */
export enum EfectoRemotoMikrotik {
  /**
   * El comando modificador no comenzó.
   */
  NO_INICIADO = 'NO_INICIADO',

  /**
   * El comando pudo llegar al router, pero no se confirmó
   * el resultado final.
   */
  POSIBLE = 'POSIBLE',

  /**
   * Una consulta posterior confirmó el cambio.
   */
  CONFIRMADO = 'CONFIRMADO',
}

/**
 * Códigos técnicos estables del módulo SSH.
 *
 * Estos valores sí pueden almacenarse en:
 *
 * - PppoeOperacion.errorCodigo;
 * - PppoeOperacionPaso.errorCodigo;
 * - auditorías.
 */
export enum CodigoErrorMikrotikSsh {
  CONFIGURACION_INVALIDA = 'CONFIGURACION_INVALIDA',

  HOST_INVALIDO = 'HOST_INVALIDO',

  PUERTO_INVALIDO = 'PUERTO_INVALIDO',

  CREDENCIALES_INVALIDAS = 'CREDENCIALES_INVALIDAS',

  CLAVE_PRIVADA_INVALIDA = 'CLAVE_PRIVADA_INVALIDA',

  DNS_NO_RESUELTO = 'DNS_NO_RESUELTO',

  CONEXION_RECHAZADA = 'CONEXION_RECHAZADA',

  RED_INALCANZABLE = 'RED_INALCANZABLE',

  HOST_INALCANZABLE = 'HOST_INALCANZABLE',

  TIMEOUT_HANDSHAKE = 'TIMEOUT_HANDSHAKE',

  HUELLA_HOST_NO_COINCIDE = 'HUELLA_HOST_NO_COINCIDE',

  AUTENTICACION_RECHAZADA = 'AUTENTICACION_RECHAZADA',

  CONEXION_PERDIDA = 'CONEXION_PERDIDA',

  APERTURA_CANAL_FALLIDA = 'APERTURA_CANAL_FALLIDA',

  TIMEOUT_COMANDO = 'TIMEOUT_COMANDO',

  COMANDO_RECHAZADO = 'COMANDO_RECHAZADO',

  SALIDA_DEMASIADO_GRANDE = 'SALIDA_DEMASIADO_GRANDE',

  RESPUESTA_INVALIDA = 'RESPUESTA_INVALIDA',

  SECRET_NO_ENCONTRADO = 'SECRET_NO_ENCONTRADO',

  SECRET_YA_EXISTE = 'SECRET_YA_EXISTE',

  PERFIL_NO_COINCIDE = 'PERFIL_NO_COINCIDE',

  ESTADO_SECRET_NO_CONFIRMADO = 'ESTADO_SECRET_NO_CONFIRMADO',

  SESION_NO_CONFIRMADA = 'SESION_NO_CONFIRMADA',

  CIERRE_SESION_FALLIDO = 'CIERRE_SESION_FALLIDO',

  ERROR_DESCONOCIDO = 'ERROR_DESCONOCIDO',
}

/**
 * Estado de una sesión SSH administrada por el adaptador.
 */
export enum EstadoSesionMikrotikSsh {
  CONECTANDO = 'CONECTANDO',

  ABIERTA = 'ABIERTA',

  CERRANDO = 'CERRANDO',

  CERRADA = 'CERRADA',

  FALLIDA = 'FALLIDA',
}
