import { ImagenPerfilInvalidaError } from '../errors/usuario.errors';

export const MAXIMO_BYTES_IMAGEN_PERFIL = 5 * 1024 * 1024;

export type MimeImagenPerfil = 'image/jpeg' | 'image/png' | 'image/webp';

function empiezaCon(bytes: Buffer, firma: number[], desde = 0): boolean {
  return firma.every((valor, i) => bytes[desde + i] === valor);
}

/** El tipo sale del contenido: el nombre y el tipo declarado no se creen. */
function tipoDeImagen(bytes: Buffer): MimeImagenPerfil | null {
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

export function validarImagenPerfil(
  bytes: Buffer | undefined,
): MimeImagenPerfil {
  if (!bytes?.length) {
    throw new ImagenPerfilInvalidaError('Adjunte una imagen.');
  }
  if (bytes.length > MAXIMO_BYTES_IMAGEN_PERFIL) {
    throw new ImagenPerfilInvalidaError('La imagen puede pesar hasta 5 MB.');
  }

  const mime = tipoDeImagen(bytes);
  if (!mime) {
    throw new ImagenPerfilInvalidaError(
      'Solo se admiten imágenes JPG, PNG o WebP.',
    );
  }

  return mime;
}
