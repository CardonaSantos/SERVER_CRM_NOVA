import { RolUsuario } from '../enums/rol-usuario.enum';
import {
  ImagenPerfilInvalidaError,
  UsuarioAccionSobreSiMismoError,
  UsuarioUltimoSuperAdminError,
} from '../errors/usuario.errors';
import { correoReservado, normalizarCorreo } from './datos-usuario.policy';
import {
  MAXIMO_BYTES_IMAGEN_PERFIL,
  validarImagenPerfil,
} from './imagen-perfil.policy';
import {
  asegurarQueNoEsUnoMismo,
  asegurarQueQuedaSuperAdmin,
} from './super-admin.policy';

const SA = { rol: RolUsuario.SUPER_ADMIN, activo: true, eliminado: false };

describe('reglas de usuario', () => {
  describe('último super administrador', () => {
    it('no deja quitar al único', () => {
      expect(() =>
        asegurarQueQuedaSuperAdmin(SA, { ...SA, activo: false }, 1),
      ).toThrow(UsuarioUltimoSuperAdminError);
      expect(() =>
        asegurarQueQuedaSuperAdmin(SA, { ...SA, rol: RolUsuario.ADMIN }, 1),
      ).toThrow(UsuarioUltimoSuperAdminError);
      expect(() =>
        asegurarQueQuedaSuperAdmin(SA, { ...SA, eliminado: true }, 1),
      ).toThrow(UsuarioUltimoSuperAdminError);
    });

    it('sí, si queda otro, o si el afectado no contaba', () => {
      expect(() =>
        asegurarQueQuedaSuperAdmin(SA, { ...SA, activo: false }, 2),
      ).not.toThrow();
      const inactivo = { ...SA, activo: false };
      expect(() =>
        asegurarQueQuedaSuperAdmin(
          inactivo,
          { ...inactivo, eliminado: true },
          1,
        ),
      ).not.toThrow();
      const admin = { ...SA, rol: RolUsuario.ADMIN };
      expect(() =>
        asegurarQueQuedaSuperAdmin(admin, { ...admin, activo: false }, 1),
      ).not.toThrow();
    });
  });

  it('nadie actúa sobre su propia cuenta', () => {
    expect(() => asegurarQueNoEsUnoMismo(4, 4)).toThrow(
      UsuarioAccionSobreSiMismoError,
    );
    expect(() => asegurarQueNoEsUnoMismo(4, 5)).not.toThrow();
  });

  it('el correo reservado no se puede elegir', () => {
    expect(() => normalizarCorreo(correoReservado(3))).toThrow();
  });

  describe('imagen de perfil', () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1,
    ]);
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const webp = Buffer.from('RIFF0000WEBPVP8 ');

    it('reconoce el tipo por el contenido', () => {
      expect(validarImagenPerfil(png)).toBe('image/png');
      expect(validarImagenPerfil(jpg)).toBe('image/jpeg');
      expect(validarImagenPerfil(webp)).toBe('image/webp');
    });

    it.each([
      ['vacía', Buffer.alloc(0)],
      ['sin archivo', undefined],
      ['otro tipo', Buffer.from('%PDF-1.7')],
      [
        'más de 5 MB',
        Buffer.concat([jpg, Buffer.alloc(MAXIMO_BYTES_IMAGEN_PERFIL)]),
      ],
    ])('rechaza %s', (_caso, bytes) => {
      expect(() => validarImagenPerfil(bytes)).toThrow(
        ImagenPerfilInvalidaError,
      );
    });
  });
});
