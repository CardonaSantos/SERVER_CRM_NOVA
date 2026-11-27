import { Type } from '@nestjs/common';
import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';
import { ActualizarMiPerfilDto } from './actualizar-mi-perfil.dto';
import { ActualizarUsuarioDto } from './actualizar-usuario.dto';
import { CambiarContrasenaUsuarioDto } from './cambiar-contrasena-usuario.dto';
import { CrearUsuarioDto } from './crear-usuario.dto';
import { ListarUsuariosQueryDto } from './listar-usuarios-query.dto';
import { OpcionesUsuarioQueryDto } from './opciones-usuario-query.dto';

describe('DTO de usuarios', () => {
  const pipe = new ValidacionGlobalPipe();
  const validar = (
    metatype: Type,
    valor: object,
    type: 'body' | 'query' = 'body',
  ) => pipe.transform(valor, { type, metatype });
  const alta = {
    nombre: 'Luis',
    correo: 'luis@correo.test',
    rol: 'TECNICO',
    contrasena: 'secreta123',
  };

  it('acepta un alta, con el correo recortado', async () => {
    await expect(validar(CrearUsuarioDto, alta)).resolves.toBeTruthy();
    await expect(
      validar(CrearUsuarioDto, { ...alta, correo: ' Luis@Correo.test ' }),
    ).resolves.toMatchObject({ correo: 'Luis@Correo.test' });
  });

  it.each([
    { empresaId: 1 },
    { activo: true },
    { contrasena: 'corta' },
    { rol: 'USER' },
    { correo: 'no-es-correo' },
  ])('el alta rechaza %j', async (cambio) => {
    await expect(
      validar(CrearUsuarioDto, { ...alta, ...cambio }),
    ).rejects.toThrow();
  });

  it('la edición no admite estado ni contraseña', async () => {
    await expect(
      validar(ActualizarUsuarioDto, { telefono: null }),
    ).resolves.toBeTruthy();
    await expect(
      validar(ActualizarUsuarioDto, { activo: false }),
    ).rejects.toThrow();
    await expect(
      validar(ActualizarUsuarioDto, { contrasena: 'secreta123' }),
    ).rejects.toThrow();
  });

  it('mi perfil no admite correo ni rol', async () => {
    await expect(
      validar(ActualizarMiPerfilDto, { bio: null, notificarPush: false }),
    ).resolves.toBeTruthy();
    await expect(
      validar(ActualizarMiPerfilDto, { correo: 'a@b.c' }),
    ).rejects.toThrow();
    await expect(
      validar(ActualizarMiPerfilDto, { rol: 'ADMIN' }),
    ).rejects.toThrow();
    await expect(
      validar(ActualizarMiPerfilDto, { notificarPush: 'false' }),
    ).rejects.toThrow();
  });

  it('cambiar contraseña pide la actual y una nueva de 8 o más', async () => {
    await expect(
      validar(CambiarContrasenaUsuarioDto, {
        contrasenaActual: 'x',
        contrasenaNueva: 'nueva12345',
      }),
    ).resolves.toBeTruthy();
    await expect(
      validar(CambiarContrasenaUsuarioDto, { contrasenaNueva: 'nueva12345' }),
    ).rejects.toThrow();
    await expect(
      validar(CambiarContrasenaUsuarioDto, {
        contrasenaActual: 'x',
        contrasenaNueva: 'corta',
      }),
    ).rejects.toThrow();
  });

  it('los filtros aceptan uno o varios valores', async () => {
    const lista = (await validar(
      ListarUsuariosQueryDto,
      { roles: 'TECNICO', estados: ['ACTIVO', 'ELIMINADO'], page: '2' },
      'query',
    )) as ListarUsuariosQueryDto;
    expect(lista).toMatchObject({
      roles: ['TECNICO'],
      estados: ['ACTIVO', 'ELIMINADO'],
      page: 2,
    });

    const opciones = (await validar(
      OpcionesUsuarioQueryDto,
      { roles: ['TECNICO', 'COBRADOR'] },
      'query',
    )) as OpcionesUsuarioQueryDto;
    expect(opciones.roles).toEqual(['TECNICO', 'COBRADOR']);
    await expect(
      validar(OpcionesUsuarioQueryDto, { roles: 'NADIE' }, 'query'),
    ).rejects.toThrow();
  });
});
