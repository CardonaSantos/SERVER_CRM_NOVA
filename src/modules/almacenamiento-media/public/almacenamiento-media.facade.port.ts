import { CategoriaMedia, TipoMedia } from '../domain/enums/media.enum';

/**
 * API pública del módulo almacenamiento-media (estándar §8).
 *
 * Otros módulos inyectan `@Inject(ALMACENAMIENTO_MEDIA)` y usan esta
 * interfaz; no conocen el proveedor (hoy DigitalOcean Spaces) ni Prisma.
 */
export const ALMACENAMIENTO_MEDIA = Symbol('ALMACENAMIENTO_MEDIA');

/** Sube un archivo y lo registra en la tabla `Media`. */
export type SubirMediaInput = {
  empresaId: number;
  clienteId?: number;
  albumId?: number;
  subidoPorId?: number;
  publico: boolean;
  /** Si se omite, la BD usa CLIENTE_GENERAL. */
  categoria?: CategoriaMedia;
  /** Tipo declarado; si la firma del archivo lo identifica, manda la firma. */
  tipo: TipoMedia;
  buffer: Buffer;
  fileName: string;
  mime: string;
  titulo?: string;
  descripcion?: string;
  etiqueta?: string;
  /** Prefijo raíz de la ruta. Por defecto MEDIA_BASE_PREFIX o 'crm'. */
  basePrefix?: string;
  /**
   * Ruta semántica opcional dentro del recurso
   * (p. ej. `firmas/tickets/62/conformidades/2`). Si se indica, reemplaza
   * la carpeta automática derivada de `tipo`.
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

/** Sube un archivo al almacenamiento sin registrarlo en `Media`. */
export type SubirArchivoInput = {
  buffer: Buffer;
  mime: string;
  fileName?: string;
  empresaId: number;
  clienteId?: number;
  /** Carpeta lógica (p. ej. 'IMAGEN', 'perfil-avatar'). */
  tipo?: string;
  basePrefix?: string;
};

export type SubirArchivoResult = {
  provider: string;
  bucket: string;
  key: string;
  cdnUrl: string;
  mimeType: string;
  extension: string;
  size?: number;
};

/** Borra el archivo del almacenamiento y su fila en `Media`. */
export type EliminarMediaInput = {
  id: number;
  empresaId: number;
};

export type EliminarMediaResult = {
  id: number;
  eliminado: boolean;
};

/** Borra un archivo del almacenamiento (sin fila en `Media`). */
export type EliminarArchivoInput = {
  bucket?: string;
  key: string;
};

export interface AlmacenamientoMediaFacadePort {
  subirMedia(input: SubirMediaInput): Promise<SubirMediaResult>;

  subirArchivo(input: SubirArchivoInput): Promise<SubirArchivoResult>;

  eliminarMedia(input: EliminarMediaInput): Promise<EliminarMediaResult>;

  eliminarArchivo(input: EliminarArchivoInput): Promise<void>;
}
