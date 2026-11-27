import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { TipoImagenPerfil } from '../../domain/enums/tipo-imagen-perfil.enum';
import {
  ImagenPerfilInvalidaError,
  UsuarioEliminadoError,
} from '../../domain/errors/usuario.errors';
import { HashContrasenaFake } from '../../test/fakes/hash-contrasena.fake';
import { ImagenPerfilFake } from '../../test/fakes/imagen-perfil.fake';
import { PerfilUsuarioRepositoryFake } from '../../test/fakes/perfil-usuario-repository.fake';
import {
  ContrasenaIncorrectaFake,
  ReautenticacionUsuarioFake,
} from '../../test/fakes/reautenticacion-usuario.fake';
import { SesionesUsuarioFake } from '../../test/fakes/sesiones-usuario.fake';
import { UsuarioRepositoryFake } from '../../test/fakes/usuario-repository.fake';
import { MiPerfilService } from '../services/mi-perfil.service';
import { ActualizarMiPerfilUseCase } from './actualizar-mi-perfil.use-case';
import { CambiarImagenPerfilUseCase } from './cambiar-imagen-perfil.use-case';
import { CambiarMiContrasenaUseCase } from './cambiar-mi-contrasena.use-case';
import { QuitarImagenPerfilUseCase } from './quitar-imagen-perfil.use-case';

const AHORA = new Date('2026-11-29T16:00:00.000Z');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);

describe('mi perfil', () => {
  let usuarios: UsuarioRepositoryFake;
  let perfiles: PerfilUsuarioRepositoryFake;
  let imagenes: ImagenPerfilFake;
  let sesiones: SesionesUsuarioFake;
  let miPerfil: MiPerfilService;
  const unidad = new UnidadDeTrabajoEnMemoria();
  const reloj = new RelojFijo(AHORA);
  let yo: number;

  beforeEach(() => {
    usuarios = new UsuarioRepositoryFake();
    perfiles = new PerfilUsuarioRepositoryFake();
    imagenes = new ImagenPerfilFake();
    sesiones = new SesionesUsuarioFake();
    miPerfil = new MiPerfilService(usuarios, perfiles);
    yo = usuarios.sembrar({ telefono: '5555' });
  });

  describe('datos y preferencias', () => {
    const actualizar = () =>
      new ActualizarMiPerfilUseCase(
        usuarios,
        perfiles,
        miPerfil,
        unidad,
        reloj,
      );

    it('el teléfono se guarda solo en el usuario', async () => {
      const r = await actualizar().execute({ usuarioId: yo, telefono: '7777' });

      expect(usuarios.fila(yo).telefono).toBe('7777');
      expect(perfiles.filas.size).toBe(0);
      expect(r.perfil).toBeNull();
    });

    it('crea el perfil al primer cambio de preferencias', async () => {
      const r = await actualizar().execute({
        usuarioId: yo,
        bio: 'Hola',
        notificarSonido: false,
      });

      expect(r.perfil?.toPrimitives()).toMatchObject({
        bio: 'Hola',
        notificarSonido: false,
        notificarPush: true,
      });
      expect(usuarios.pasos).toEqual([`bloquear:${yo}`]);
    });

    it('un usuario eliminado no edita su perfil', async () => {
      usuarios.fila(yo).eliminadoEn = AHORA;
      await expect(
        actualizar().execute({ usuarioId: yo, nombre: 'X' }),
      ).rejects.toThrow(UsuarioEliminadoError);
    });
  });

  describe('contraseña propia', () => {
    const cambiar = () =>
      new CambiarMiContrasenaUseCase(
        usuarios,
        new HashContrasenaFake(),
        new ReautenticacionUsuarioFake(),
        sesiones,
        miPerfil,
        unidad,
        reloj,
      );

    it('pide la actual y cierra las demás sesiones', async () => {
      const r = await cambiar().execute({
        usuarioId: yo,
        sesionId: 'esta',
        contrasenaActual: 'mia-actual',
        contrasenaNueva: 'nueva12345',
      });

      expect(usuarios.fila(yo).contrasenaHash).toBe('hash:nueva12345');
      expect(sesiones.cierres).toEqual([
        { usuarioId: yo, excepto: 'esta', motivo: 'CONTRASENA_CAMBIADA' },
      ]);
      expect(r).toEqual({ sesionesCerradas: 1 });
    });

    it('con la actual incorrecta no cambia nada', async () => {
      await expect(
        cambiar().execute({
          usuarioId: yo,
          sesionId: 'esta',
          contrasenaActual: 'equivocada',
          contrasenaNueva: 'nueva12345',
        }),
      ).rejects.toThrow(ContrasenaIncorrectaFake);
      expect(usuarios.fila(yo).contrasenaHash).toBe('hash:secreta1');
    });
  });

  describe('imágenes', () => {
    const poner = () =>
      new CambiarImagenPerfilUseCase(
        usuarios,
        perfiles,
        imagenes,
        miPerfil,
        unidad,
        reloj,
      );
    const quitar = () =>
      new QuitarImagenPerfilUseCase(
        usuarios,
        perfiles,
        imagenes,
        miPerfil,
        unidad,
        reloj,
      );
    const subir = (tipo = TipoImagenPerfil.AVATAR) =>
      poner().execute({ usuarioId: yo, empresaId: 1, tipo, bytes: PNG });

    it('sube la nueva y después borra la anterior', async () => {
      await subir();
      const r = await subir();

      expect(imagenes.subidas).toHaveLength(2);
      expect(imagenes.borradas).toEqual([imagenes.subidas[0]]);
      expect(r.perfil?.toPrimitives().avatar?.key).toBe(imagenes.subidas[1]);
    });

    it('si no se puede guardar, borra la nueva y conserva la anterior', async () => {
      await subir();
      perfiles.fallarAlGuardar = new Error('base caída');

      await expect(subir()).rejects.toThrow('base caída');
      expect(imagenes.borradas).toEqual([imagenes.subidas[1]]);
      expect(perfiles.filas.get(yo)?.avatar?.key).toBe(imagenes.subidas[0]);
    });

    it('rechaza lo que no es imagen sin subir nada', async () => {
      await expect(
        poner().execute({
          usuarioId: yo,
          empresaId: 1,
          tipo: TipoImagenPerfil.PORTADA,
          bytes: Buffer.from('%PDF'),
        }),
      ).rejects.toThrow(ImagenPerfilInvalidaError);
      expect(imagenes.subidas).toEqual([]);
    });

    it('quitar borra el archivo después de guardar; sin imagen no es error', async () => {
      await expect(
        quitar().execute({ usuarioId: yo, tipo: TipoImagenPerfil.PORTADA }),
      ).resolves.toBeTruthy();

      await subir(TipoImagenPerfil.PORTADA);
      const r = await quitar().execute({
        usuarioId: yo,
        tipo: TipoImagenPerfil.PORTADA,
      });

      expect(r.perfil?.toPrimitives().portada).toBeNull();
      expect(imagenes.borradas).toEqual([imagenes.subidas[0]]);
    });
  });
});
