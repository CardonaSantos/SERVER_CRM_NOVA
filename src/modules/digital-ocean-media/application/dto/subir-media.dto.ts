import { TipoMedia } from '@prisma/client';

// src/modules/media/application/dto/subir-media.dto.ts
export type SubirMediaCommand = {
  empresaId: number;
  clienteId?: number;
  albumId?: number;
  subidoPorId?: number;
  publico: boolean;
  categoria: string; // usa tus valores de dominio
  tipo: TipoMedia;
  // archivo
  buffer: Buffer;
  fileName: string; // original
  mime: string; // p.ej. image/webp
  // opcionales
  titulo?: string;
  descripcion?: string;
  etiqueta?: string;

  basePrefix?: string; // ej. "crm" o "pos/clientes" a donde se sube
};

export type SubirMediaResult = {
  id: number;
  cdnUrl?: string;
  bucket: string;
  key: string;
  tipo: string;
};
