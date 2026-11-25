import { CategoriaMedia, EstadoMedia, TipoMedia } from '../enums/media.enum';

/** Archivo registrado en la tabla `Media`. */
export type MediaAsset = {
  // Identidad y pertenencia
  id?: number; // opcional antes de persistir
  empresaId: number;
  clienteId?: number;
  albumId?: number;
  subidoPorId?: number;

  // Almacenamiento
  provider: string; // p. ej. 'do-spaces'
  bucket: string;
  region?: string;
  key: string; // p. ej. "crm/empresas/1/clientes/1001/imagenes/2026/11/24/uuid.webp"
  cdnUrl?: string;

  // Metadatos del archivo
  mimeType?: string;
  extension?: string;
  tamanioBytes?: number;
  ancho?: number;
  alto?: number;
  duracionSeg?: number;
  checksumSha256?: string | null;
  metadatos?: Record<string, unknown> | null;

  // Semántica de negocio
  categoria?: CategoriaMedia; // la BD usa CLIENTE_GENERAL por defecto
  tipo: TipoMedia;
  publico: boolean;
  estado: EstadoMedia;

  // Organización y auditoría
  titulo?: string;
  descripcion?: string;
  etiqueta?: string;
  orden?: number;
  tomadoEn?: Date;
  creadoEn?: Date;
  actualizadoEn?: Date;
  eliminadoEn?: Date | null;
};
