/** Qué pasó al preparar la cuenta PPPoE al crear (o reintentar) una instalación. */
export enum EstadoResultadoPrealtaPppoe {
  /** El acceso no es FIBRA_GPON + PPPOE: no hay prealta automática. */
  NO_APLICA = 'NO_APLICA',

  /** Se creó una cuenta PPPoE nueva. */
  CREADA = 'CREADA',

  /** El acceso ya tenía cuenta: no se duplicó nada. */
  YA_EXISTIA = 'YA_EXISTIA',

  /** La instalación y el acceso quedaron creados, pero la prealta falló. */
  FALLIDA = 'FALLIDA',
}
