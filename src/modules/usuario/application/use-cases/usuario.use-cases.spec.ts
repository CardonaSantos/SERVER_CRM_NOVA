import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import {
  UsuarioAccionSobreSiMismoError,
  UsuarioCorreoDuplicadoError,
  UsuarioCorreoEnUsoError,
  UsuarioEliminadoError,
  UsuarioNoEncontradoError,
  UsuarioUltimoSuperAdminError,
} from '../../domain/errors/usuario.errors';
import { HashContrasenaFake } from '../../test/fakes/hash-contrasena.fake';
import {
  ContrasenaIncorrectaFake,
  ReautenticacionUsuarioFake,
} from '../../test/fakes/reautenticacion-usuario.fake';
import { SesionesUsuarioFake } from '../../test/fakes/sesiones-usuario.fake';
import { UsuarioRepositoryFake } from '../../test/fakes/usuario-repository.fake';
import { ActivarUsuarioUseCase } from './activar-usuario.use-case';
import { ActualizarUsuarioUseCase } from './actualizar-usuario.use-case';
import { BuscarCredencialesUsuarioUseCase } from './buscar-credenciales-usuario.use-case';
import { CambiarContrasenaUsuarioUseCase } from './cambiar-contrasena-usuario.use-case';
import { CrearUsuarioUseCase } from './crear-usuario.use-case';
import { DesactivarUsuarioUseCase } from './desactivar-usuario.use-case';
import { EliminarUsuarioUseCase } from './eliminar-usuario.use-case';
import { RestaurarUsuarioUseCase } from './restaurar-usuario.use-case';
import { VerificarContrasenaUsuarioUseCase } from './verificar-contrasena-usuario.use-case';

const AHORA = new Date('2026-11-29T16:00:00.000Z');
const { SUPER_ADMIN, ADMIN, TECNICO } = RolUsuario;

describe('gestión de usuarios', () => {
  let usuarios: UsuarioRepositoryFake;
  let unidad: UnidadDeTrabajoEnMemoria;
  let sesiones: SesionesUsuarioFake;
  let reautenticacion: ReautenticacionUsuarioFake;
  const hash = new HashContrasenaFake();
  const reloj = new RelojFijo(AHORA);
  let jefe: number;

  beforeEach(() => {
    usuarios = new UsuarioRepositoryFake();
    unidad = new UnidadDeTrabajoEnMemoria();
    sesiones = new SesionesUsuarioFake();
    reautenticacion = new ReautenticacionUsuarioFake();
    jefe = usuarios.sembrar({ rol: SUPER_ADMIN, correo: 'jefe@correo.test' });
  });

  describe('alta', () => {
    const crear = () => new CrearUsuarioUseCase(usuarios, hash, unidad, reloj);
    const alta = {
      actorId: 1,
      empresaId: 1,
      nombre: 'Luis',
      rol: TECNICO,
      contrasena: 'secreta123',
    };

    it('codifica la contraseña una sola vez', async () => {
      const u = await crear().execute({ ...alta, correo: 'Luis@Correo.test' });

      expect(usuarios.fila(u.id!)).toMatchObject({
        correo: 'luis@correo.test',
        contrasenaHash: 'hash:secreta123',
        activo: true,
      });
    });

    it('rechaza un correo que ya existe', async () => {
      await expect(
        crear().execute({ ...alta, correo: ' JEFE@correo.test ' }),
      ).rejects.toThrow(UsuarioCorreoDuplicadoError);
    });

    it('reusa el correo de un usuario eliminado', async () => {
      await new EliminarUsuarioUseCase(
        usuarios,
        sesiones,
        unidad,
        reloj,
      ).execute({
        actorId: jefe,
        usuarioId: usuarios.sembrar({ correo: 'luis@correo.test' }),
      });

      const u = await crear().execute({ ...alta, correo: 'luis@correo.test' });
      expect(usuarios.fila(u.id!).correo).toBe('luis@correo.test');
    });
  });

  describe('edición', () => {
    const editar = () => new ActualizarUsuarioUseCase(usuarios, unidad, reloj);

    it('cambia datos y rol de otro', async () => {
      const id = usuarios.sembrar();
      await editar().execute({
        actorId: jefe,
        usuarioId: id,
        nombre: 'Nuevo',
        rol: ADMIN,
      });

      expect(usuarios.fila(id)).toMatchObject({ nombre: 'Nuevo', rol: ADMIN });
      expect(usuarios.pasos).toEqual([
        'superAdmins',
        `bloquear:${id}`,
        `guardar:${id}`,
      ]);
    });

    it('no guarda si nada cambió', async () => {
      const id = usuarios.sembrar({ nombre: 'Igual' });
      await editar().execute({ actorId: jefe, usuarioId: id, nombre: 'Igual' });

      expect(usuarios.pasos).toEqual([`bloquear:${id}`]);
    });

    it('rechaza el correo de otro', async () => {
      const id = usuarios.sembrar();
      await expect(
        editar().execute({
          actorId: jefe,
          usuarioId: id,
          correo: 'jefe@correo.test',
        }),
      ).rejects.toThrow(UsuarioCorreoDuplicadoError);
    });

    it('nadie cambia su propio rol, pero sí sus datos', async () => {
      await expect(
        editar().execute({ actorId: jefe, usuarioId: jefe, rol: ADMIN }),
      ).rejects.toThrow(UsuarioAccionSobreSiMismoError);

      await editar().execute({
        actorId: jefe,
        usuarioId: jefe,
        nombre: 'Jefe',
      });
      expect(usuarios.fila(jefe)).toMatchObject({
        nombre: 'Jefe',
        rol: SUPER_ADMIN,
      });
    });

    it('no quita el rol al último super administrador', async () => {
      const otro = usuarios.sembrar({ rol: ADMIN });
      usuarios.fila(jefe).activo = false;
      const ultimo = usuarios.sembrar({ rol: SUPER_ADMIN });

      await expect(
        editar().execute({ actorId: otro, usuarioId: ultimo, rol: ADMIN }),
      ).rejects.toThrow(UsuarioUltimoSuperAdminError);
    });

    it('un eliminado no se edita', async () => {
      const id = usuarios.sembrar({ eliminadoEn: AHORA, activo: false });
      await expect(
        editar().execute({ actorId: jefe, usuarioId: id, nombre: 'X' }),
      ).rejects.toThrow(UsuarioEliminadoError);
    });

    it('no encuentra lo que no existe', async () => {
      await expect(
        editar().execute({ actorId: jefe, usuarioId: 99, nombre: 'X' }),
      ).rejects.toThrow(UsuarioNoEncontradoError);
    });
  });

  describe('contraseña de otro', () => {
    const cambiar = () =>
      new CambiarContrasenaUsuarioUseCase(
        usuarios,
        hash,
        reautenticacion,
        sesiones,
        unidad,
        reloj,
      );

    it('pide la de quien actúa y cierra todas las sesiones del otro', async () => {
      const id = usuarios.sembrar();
      const r = await cambiar().execute({
        actorId: jefe,
        usuarioId: id,
        contrasenaActual: 'mia-actual',
        contrasenaNueva: 'nueva12345',
      });

      expect(usuarios.fila(id).contrasenaHash).toBe('hash:nueva12345');
      expect(reautenticacion.confirmados).toEqual([jefe]);
      expect(sesiones.cierres).toEqual([
        { usuarioId: id, excepto: null, motivo: 'CONTRASENA_CAMBIADA' },
      ]);
      expect(r).toEqual({ usuarioId: id, sesionesCerradas: 2 });
    });

    it('sin la contraseña correcta no cambia nada', async () => {
      const id = usuarios.sembrar();
      await expect(
        cambiar().execute({
          actorId: jefe,
          usuarioId: id,
          contrasenaActual: 'otra',
          contrasenaNueva: 'nueva12345',
        }),
      ).rejects.toThrow(ContrasenaIncorrectaFake);
      expect(usuarios.fila(id).contrasenaHash).toBe('hash:secreta1');
      expect(sesiones.cierres).toEqual([]);
    });

    it('la propia no se cambia por aquí', async () => {
      await expect(
        cambiar().execute({
          actorId: jefe,
          usuarioId: jefe,
          contrasenaActual: 'mia-actual',
          contrasenaNueva: 'nueva12345',
        }),
      ).rejects.toThrow(UsuarioAccionSobreSiMismoError);
    });
  });

  describe('activar y desactivar', () => {
    const desactivar = () =>
      new DesactivarUsuarioUseCase(usuarios, sesiones, unidad, reloj);

    it('desactivar cierra sus sesiones', async () => {
      const id = usuarios.sembrar();
      await desactivar().execute({ actorId: jefe, usuarioId: id });

      expect(usuarios.fila(id).activo).toBe(false);
      expect(sesiones.cierres).toEqual([
        { usuarioId: id, excepto: null, motivo: 'USUARIO_INACTIVO' },
      ]);
    });

    it('nadie se desactiva a sí mismo', async () => {
      await expect(
        desactivar().execute({ actorId: jefe, usuarioId: jefe }),
      ).rejects.toThrow(UsuarioAccionSobreSiMismoError);
    });

    it('no desactiva al último super administrador', async () => {
      const admin = usuarios.sembrar({ rol: ADMIN });
      await expect(
        desactivar().execute({ actorId: admin, usuarioId: jefe }),
      ).rejects.toThrow(UsuarioUltimoSuperAdminError);
      expect(usuarios.fila(jefe).activo).toBe(true);
    });

    it('activar vuelve a dejarlo entrar', async () => {
      const id = usuarios.sembrar({ activo: false });
      await new ActivarUsuarioUseCase(usuarios, unidad, reloj).execute({
        usuarioId: id,
      });

      expect(usuarios.fila(id).activo).toBe(true);
    });
  });

  describe('eliminar y restaurar', () => {
    const eliminar = () =>
      new EliminarUsuarioUseCase(usuarios, sesiones, unidad, reloj);
    const restaurar = () =>
      new RestaurarUsuarioUseCase(usuarios, unidad, reloj);

    it('elimina sin borrar, libera el correo y cierra sesiones', async () => {
      const id = usuarios.sembrar({ correo: 'ana@correo.test' });
      await eliminar().execute({ actorId: jefe, usuarioId: id });

      expect(usuarios.fila(id)).toMatchObject({
        activo: false,
        correo: `eliminado-${id}@usuarios.invalid`,
        correoEliminado: 'ana@correo.test',
        eliminadoEn: AHORA,
        eliminadoPorId: jefe,
      });
      expect(sesiones.cierres).toHaveLength(1);
    });

    it('no se elimina a sí mismo ni al último super administrador', async () => {
      await expect(
        eliminar().execute({ actorId: jefe, usuarioId: jefe }),
      ).rejects.toThrow(UsuarioAccionSobreSiMismoError);

      const admin = usuarios.sembrar({ rol: ADMIN });
      await expect(
        eliminar().execute({ actorId: admin, usuarioId: jefe }),
      ).rejects.toThrow(UsuarioUltimoSuperAdminError);
    });

    it('restaura con su correo, desactivado', async () => {
      const id = usuarios.sembrar({ correo: 'ana@correo.test' });
      await eliminar().execute({ actorId: jefe, usuarioId: id });
      await restaurar().execute({ usuarioId: id });

      expect(usuarios.fila(id)).toMatchObject({
        correo: 'ana@correo.test',
        correoEliminado: null,
        eliminadoEn: null,
        activo: false,
      });
    });

    it('si su correo ya lo usa otro, pide uno nuevo', async () => {
      const id = usuarios.sembrar({ correo: 'ana@correo.test' });
      await eliminar().execute({ actorId: jefe, usuarioId: id });
      usuarios.sembrar({ correo: 'ana@correo.test' });

      await expect(restaurar().execute({ usuarioId: id })).rejects.toThrow(
        UsuarioCorreoEnUsoError,
      );
      await restaurar().execute({ usuarioId: id, correo: 'ana2@correo.test' });
      expect(usuarios.fila(id).correo).toBe('ana2@correo.test');
    });
  });

  describe('para auth', () => {
    it('no encuentra credenciales con un correo mal escrito', async () => {
      const consultas = { findCredenciales: jest.fn() };
      const buscar = new BuscarCredencialesUsuarioUseCase(consultas as never);

      await expect(buscar.execute('sin-arroba')).resolves.toBeNull();
      expect(consultas.findCredenciales).not.toHaveBeenCalled();
      await buscar.execute(' Jefe@Correo.test ');
      expect(consultas.findCredenciales).toHaveBeenCalledWith(
        'jefe@correo.test',
      );
    });

    it('la contraseña vale solo para un usuario activo y no eliminado', async () => {
      const verificar = new VerificarContrasenaUsuarioUseCase(usuarios, hash);
      const inactivo = usuarios.sembrar({ activo: false });
      const eliminado = usuarios.sembrar({ eliminadoEn: AHORA });

      await expect(
        verificar.execute({ usuarioId: jefe, contrasena: 'secreta1' }),
      ).resolves.toBe(true);
      await expect(
        verificar.execute({ usuarioId: jefe, contrasena: 'otra' }),
      ).resolves.toBe(false);
      for (const usuarioId of [inactivo, eliminado, 99]) {
        await expect(
          verificar.execute({ usuarioId, contrasena: 'secreta1' }),
        ).resolves.toBe(false);
      }
    });
  });
});
