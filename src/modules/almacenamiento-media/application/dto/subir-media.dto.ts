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

  /**
   * Ruta semántica opcional dentro del recurso.
   *
   * Ejemplo:
   * firmas/tickets/62/conformidades/2
   *
   * Si no se especifica, Media conserva exactamente
   * su estructura actual basada en `tipo`.
   */
  subfolder?: string;
};

export type SubirMediaResult = {
  id: number;

  cdnUrl?: string;

  bucket: string;

  key: string;

  tipo: TipoMedia;
};
