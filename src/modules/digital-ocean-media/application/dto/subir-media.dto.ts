import { CategoriaMedia, TipoMedia } from '@prisma/client';

export type SubirMediaCommand = {
  empresaId: number;

  clienteId?: number;

  albumId?: number;

  subidoPorId?: number;

  publico: boolean;

  categoria: CategoriaMedia;

  tipo: TipoMedia;

  buffer: Buffer;

  fileName: string;

  mime: string;

  titulo?: string;

  descripcion?: string;

  etiqueta?: string;

  basePrefix?: string;
};

export type SubirMediaResult = {
  id: number;

  cdnUrl?: string;

  bucket: string;

  key: string;

  tipo: TipoMedia;
};
