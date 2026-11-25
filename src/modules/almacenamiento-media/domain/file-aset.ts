import { CategoriaMedia, EstadoMedia, TipoMedia } from '@prisma/client';

export type MediaAsset = {
  // Identidad & pertenencia
  id?: number; // opcional antes de persistir
  empresaId: number;
  clienteId?: number;
  albumId?: number;
  subidoPorId?: number;

  // Storage (DO Spaces + CDN)
  provider: 'do-spaces'; // restringe el proveedor en el dominio
  bucket: string; // en dominio lo exigimos (clave para borrar/mover)
  region?: string;
  key: string; // ej: "empresas/42/clientes/1001/2025/11/uuid.webp"
  cdnUrl?: string; // con CDN público puedes guardarla

  // Metadatos de archivo
  mimeType?: string;
  extension?: string;
  tamanioBytes?: number;
  ancho?: number; // imágenes
  alto?: number; // imágenes
  duracionSeg?: number; // video/audio
  checksumSha256?: string | null; // hash es string, no number
  metadatos?: Record<string, unknown> | null;

  // Semántica de negocio
  categoria: CategoriaMedia;
  tipo: TipoMedia;
  publico: boolean; // guía cómo entregar la URL (público/privado)
  estado: EstadoMedia; // ACTIVO, PENDIENTE, etc.

  // Auditoría/organización
  titulo?: string;
  descripcion?: string;
  etiqueta?: string;
  orden?: number;
  tomadoEn?: Date;
  creadoEn?: Date;
  actualizadoEn?: Date;
  eliminadoEn?: Date | null;
};
