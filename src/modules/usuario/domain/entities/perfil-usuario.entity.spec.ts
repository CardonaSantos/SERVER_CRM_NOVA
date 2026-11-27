import { TipoImagenPerfil } from '../enums/tipo-imagen-perfil.enum';
import { UsuarioInvalidoError } from '../errors/usuario.errors';
import { ImagenPerfil } from '../props/perfil-usuario.props';
import { PerfilUsuarioEntity } from './perfil-usuario.entity';

const AHORA = new Date('2026-11-29T16:00:00.000Z');
const imagen = (key: string): ImagenPerfil => ({
  url: `https://cdn.test/${key}`,
  key,
  bucket: 'b',
  mimeType: 'image/png',
  size: 10,
});

describe('PerfilUsuarioEntity', () => {
  it('nace con todos los avisos encendidos', () => {
    expect(PerfilUsuarioEntity.create(3, AHORA).toPrimitives()).toMatchObject({
      usuarioId: 3,
      bio: null,
      avatar: null,
      notificarWhatsApp: true,
      notificarPush: true,
      notificarSonido: true,
    });
  });

  it('cambia solo las preferencias que llegan; una descripción vacía se quita', () => {
    const p = PerfilUsuarioEntity.create(3, AHORA);
    p.actualizar({ bio: ' Hola ', notificarPush: false }, AHORA);
    expect(p.toPrimitives()).toMatchObject({
      bio: 'Hola',
      notificarPush: false,
      notificarSonido: true,
    });

    p.actualizar({ bio: '' }, AHORA);
    expect(p.toPrimitives().bio).toBeNull();
  });

  it('rechaza una descripción demasiado larga', () => {
    expect(() =>
      PerfilUsuarioEntity.create(3, AHORA).actualizar(
        { bio: 'x'.repeat(2001) },
        AHORA,
      ),
    ).toThrow(UsuarioInvalidoError);
  });

  it('poner una imagen devuelve la que reemplaza', () => {
    const p = PerfilUsuarioEntity.create(3, AHORA);

    expect(
      p.ponerImagen(TipoImagenPerfil.AVATAR, imagen('a1'), AHORA),
    ).toBeNull();
    expect(
      p.ponerImagen(TipoImagenPerfil.AVATAR, imagen('a2'), AHORA)?.key,
    ).toBe('a1');
    expect(p.toPrimitives().avatar?.key).toBe('a2');
    expect(p.toPrimitives().portada).toBeNull();
  });

  it('quitar una imagen devuelve la quitada, o null si no había', () => {
    const p = PerfilUsuarioEntity.create(3, AHORA);
    expect(p.quitarImagen(TipoImagenPerfil.PORTADA, AHORA)).toBeNull();

    p.ponerImagen(TipoImagenPerfil.PORTADA, imagen('p1'), AHORA);
    expect(p.quitarImagen(TipoImagenPerfil.PORTADA, AHORA)?.key).toBe('p1');
    expect(p.toPrimitives().portada).toBeNull();
  });
});
