/**
 * Enums de media del dominio. Mismos valores que los enums de Prisma
 * (`CategoriaMedia`, `TipoMedia`, `EstadoMedia`); se declaran como
 * objeto + tipo de unión para que los valores de Prisma sean asignables
 * sin conversión. La traducción con la BD ocurre solo en el mapper.
 */
export const CategoriaMedia = {
  CLIENTE_GENERAL: 'CLIENTE_GENERAL',
  CLIENTE_CONTRATO: 'CLIENTE_CONTRATO',
  CLIENTE_INSTALACION: 'CLIENTE_INSTALACION',
  CLIENTE_DESINSTALACION: 'CLIENTE_DESINSTALACION',
  CLIENTE_ELIMINACION: 'CLIENTE_ELIMINACION',
  SOPORTE_TICKET: 'SOPORTE_TICKET',
  OTRO: 'OTRO',
} as const;

export type CategoriaMedia =
  (typeof CategoriaMedia)[keyof typeof CategoriaMedia];

export const TipoMedia = {
  IMAGEN: 'IMAGEN',
  VIDEO: 'VIDEO',
  DOCUMENTO: 'DOCUMENTO',
  AUDIO: 'AUDIO',
  OTRO: 'OTRO',
} as const;

export type TipoMedia = (typeof TipoMedia)[keyof typeof TipoMedia];

export const EstadoMedia = {
  PENDIENTE: 'PENDIENTE',
  PROCESANDO: 'PROCESANDO',
  LISTO: 'LISTO',
  FALLIDO: 'FALLIDO',
} as const;

export type EstadoMedia = (typeof EstadoMedia)[keyof typeof EstadoMedia];
