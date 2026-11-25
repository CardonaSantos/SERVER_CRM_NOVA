import { TipoMedia } from '../enums/media.enum';
import { TipoArchivoNoReconocidoError } from '../errors/almacenamiento-media.errors';

export type TipoArchivoDetectado = {
  mime: string;
  tipo: TipoMedia;
};

const FIRMA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Determina el tipo real de un archivo por su firma (primeros bytes),
 * sin confiar en el MIME que declara el cliente: JPEG, PNG, WEBP, GIF y
 * PDF. Para otros formatos conserva el MIME y el tipo declarados.
 */
export function detectarTipoArchivo(params: {
  bytes: Uint8Array;
  mimeDeclarado?: string | null;
  tipoDeclarado: TipoMedia;
}): TipoArchivoDetectado {
  const { bytes, mimeDeclarado, tipoDeclarado } = params;

  const ascii = (inicio: number, fin: number) =>
    String.fromCharCode(...bytes.subarray(inicio, fin));

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { mime: 'image/jpeg', tipo: TipoMedia.IMAGEN };
  }

  if (
    bytes.length >= FIRMA_PNG.length &&
    FIRMA_PNG.every((valor, i) => bytes[i] === valor)
  ) {
    return { mime: 'image/png', tipo: TipoMedia.IMAGEN };
  }

  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    return { mime: 'image/webp', tipo: TipoMedia.IMAGEN };
  }

  const firmaGif = ascii(0, 6);
  if (firmaGif === 'GIF87a' || firmaGif === 'GIF89a') {
    return { mime: 'image/gif', tipo: TipoMedia.IMAGEN };
  }

  if (bytes.length >= 4 && ascii(0, 4) === '%PDF') {
    return { mime: 'application/pdf', tipo: TipoMedia.DOCUMENTO };
  }

  const mimeNormalizado = mimeDeclarado?.trim().toLowerCase();

  if (!mimeNormalizado?.includes('/')) {
    throw new TipoArchivoNoReconocidoError();
  }

  return { mime: mimeNormalizado, tipo: tipoDeclarado };
}
