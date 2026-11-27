import { ComentarioImagenInvalidaError } from '../errors/ticket-soporte.errors';

export const MAXIMO_IMAGENES = 5;
export const MAXIMO_BYTES_IMAGEN = 8 * 1024 * 1024;

export type ArchivoImagen = {
  bytes: Buffer;
  nombreArchivo: string;
};

export type ImagenValidada = ArchivoImagen & {
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
};

function empiezaCon(bytes: Buffer, firma: number[], desde = 0): boolean {
  return firma.every((valor, i) => bytes[desde + i] === valor);
}

/** El tipo sale del contenido: el nombre y el tipo declarado no se creen. */
function tipoDeImagen(bytes: Buffer): ImagenValidada['mime'] | null {
  if (empiezaCon(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';

  if (empiezaCon(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }

  // "RIFF" ···· "WEBP"
  if (
    empiezaCon(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    empiezaCon(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'image/webp';
  }

  return null;
}

export function validarImagenes(archivos: ArchivoImagen[]): ImagenValidada[] {
  if (archivos.length > MAXIMO_IMAGENES) {
    throw new ComentarioImagenInvalidaError(
      `Un comentario admite hasta ${MAXIMO_IMAGENES} imágenes.`,
    );
  }

  return archivos.map((archivo) => {
    if (!archivo.bytes.length) {
      throw new ComentarioImagenInvalidaError(
        'Una de las imágenes está vacía.',
      );
    }
    if (archivo.bytes.length > MAXIMO_BYTES_IMAGEN) {
      throw new ComentarioImagenInvalidaError(
        'Cada imagen puede pesar hasta 8 MB.',
      );
    }

    const mime = tipoDeImagen(archivo.bytes);
    if (!mime) {
      throw new ComentarioImagenInvalidaError(
        'Solo se admiten imágenes JPG, PNG o WebP.',
      );
    }

    return { ...archivo, mime };
  });
}
