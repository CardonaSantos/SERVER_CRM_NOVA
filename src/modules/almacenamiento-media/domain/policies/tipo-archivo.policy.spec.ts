import { TipoMedia } from '../enums/media.enum';
import { TipoArchivoNoReconocidoError } from '../errors/almacenamiento-media.errors';

import { detectarTipoArchivo } from './tipo-archivo.policy';

const bytes = (...valores: number[]) => Uint8Array.from(valores);
const texto = (s: string) => Uint8Array.from(Buffer.from(s, 'ascii'));

describe('detectarTipoArchivo', () => {
  const base = {
    mimeDeclarado: 'application/octet-stream',
    tipoDeclarado: TipoMedia.OTRO,
  };

  it('identifica la firma real aunque el MIME declarado mienta', () => {
    expect(
      detectarTipoArchivo({ ...base, bytes: bytes(0xff, 0xd8, 0xff, 0xe0) }),
    ).toEqual({
      mime: 'image/jpeg',
      tipo: TipoMedia.IMAGEN,
    });
    expect(
      detectarTipoArchivo({
        ...base,
        bytes: bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0),
      }).mime,
    ).toBe('image/png');
    expect(
      detectarTipoArchivo({ ...base, bytes: texto('RIFF1234WEBPVP8 ') }).mime,
    ).toBe('image/webp');
    expect(
      detectarTipoArchivo({ ...base, bytes: texto('GIF89a....') }).mime,
    ).toBe('image/gif');
    expect(detectarTipoArchivo({ ...base, bytes: texto('%PDF-1.7') })).toEqual({
      mime: 'application/pdf',
      tipo: TipoMedia.DOCUMENTO,
    });
  });

  it('sin firma conocida conserva el MIME (normalizado) y el tipo declarados', () => {
    expect(
      detectarTipoArchivo({
        bytes: texto('ftypmp42'),
        mimeDeclarado: ' Video/MP4 ',
        tipoDeclarado: TipoMedia.VIDEO,
      }),
    ).toEqual({ mime: 'video/mp4', tipo: TipoMedia.VIDEO });
  });

  it('sin firma y sin MIME válido lanza un error de dominio', () => {
    expect(() =>
      detectarTipoArchivo({
        bytes: texto('xx'),
        mimeDeclarado: 'nada',
        tipoDeclarado: TipoMedia.OTRO,
      }),
    ).toThrow(TipoArchivoNoReconocidoError);
  });
});
