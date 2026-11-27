import { EstadoUsuario } from '../enums/estado-usuario.enum';
import { RolUsuario } from '../enums/rol-usuario.enum';
import {
  UsuarioEliminadoError,
  UsuarioInvalidoError,
  UsuarioNoEliminadoError,
} from '../errors/usuario.errors';
import { UsuarioProps } from '../props/usuario.props';
import { UsuarioEntity } from './usuario.entity';

const AHORA = new Date('2026-11-29T16:00:00.000Z');
const DESPUES = new Date('2026-11-30T16:00:00.000Z');

const fila = (cambios: Partial<UsuarioProps> = {}): UsuarioProps => ({
  id: 7,
  empresaId: 1,
  nombre: 'Ana',
  correo: 'ana@correo.test',
  telefono: null,
  rol: RolUsuario.OFICINA,
  activo: true,
  contrasenaHash: 'hash',
  creadoEn: AHORA,
  actualizadoEn: AHORA,
  eliminadoEn: null,
  eliminadoPorId: null,
  correoEliminado: null,
  ...cambios,
});

describe('UsuarioEntity', () => {
  it('nace activo, con el correo en minúsculas y sin espacios', () => {
    const u = UsuarioEntity.create(
      {
        empresaId: 1,
        nombre: '  Ana  ',
        correo: ' Ana@Correo.TEST ',
        telefono: '  ',
        rol: RolUsuario.TECNICO,
        contrasenaHash: 'hash',
      },
      AHORA,
    );

    expect(u.toPrimitives()).toMatchObject({
      id: null,
      nombre: 'Ana',
      correo: 'ana@correo.test',
      telefono: null,
      activo: true,
      eliminadoEn: null,
    });
  });

  it.each([
    { nombre: ' ' },
    { correo: 'sin-arroba' },
    { correo: 'alguien@usuarios.invalid' },
    { contrasenaHash: '' },
  ])('no nace con %j', (cambio) => {
    expect(() =>
      UsuarioEntity.create(
        {
          empresaId: 1,
          nombre: 'Ana',
          correo: 'ana@correo.test',
          rol: RolUsuario.OFICINA,
          contrasenaHash: 'hash',
          ...cambio,
        },
        AHORA,
      ),
    ).toThrow(UsuarioInvalidoError);
  });

  it('actualiza solo lo que llega y avisa si no cambió nada', () => {
    const u = UsuarioEntity.hydrate(fila({ telefono: '5555' }));

    expect(u.actualizarDatos({ nombre: 'Ana' }, DESPUES)).toBe(false);
    expect(u.actualizarDatos({ nombre: 'Ana María' }, DESPUES)).toBe(true);
    expect(u.toPrimitives()).toMatchObject({
      nombre: 'Ana María',
      telefono: '5555',
      actualizadoEn: DESPUES,
    });

    u.actualizarDatos({ telefono: null }, DESPUES);
    expect(u.toPrimitives().telefono).toBeNull();
  });

  it('activar y desactivar dicen si cambiaron', () => {
    const u = UsuarioEntity.hydrate(fila());

    expect(u.activar(DESPUES)).toBe(false);
    expect(u.desactivar(DESPUES)).toBe(true);
    expect(u.estado).toBe(EstadoUsuario.INACTIVO);
    expect(u.desactivar(DESPUES)).toBe(false);
  });

  it('al eliminar libera el correo y queda inactivo', () => {
    const u = UsuarioEntity.hydrate(fila());
    u.eliminar(1, DESPUES);

    expect(u.toPrimitives()).toMatchObject({
      activo: false,
      correo: 'eliminado-7@usuarios.invalid',
      correoEliminado: 'ana@correo.test',
      eliminadoEn: DESPUES,
      eliminadoPorId: 1,
    });
    expect(u.correoOriginal).toBe('ana@correo.test');
    expect(u.estado).toBe(EstadoUsuario.ELIMINADO);
  });

  it('un eliminado no se modifica', () => {
    const u = UsuarioEntity.hydrate(
      fila({ eliminadoEn: AHORA, activo: false }),
    );

    expect(() => u.actualizarDatos({ nombre: 'Otro' }, DESPUES)).toThrow(
      UsuarioEliminadoError,
    );
    expect(() => u.activar(DESPUES)).toThrow(UsuarioEliminadoError);
    expect(() => u.cambiarRol(RolUsuario.ADMIN, DESPUES)).toThrow(
      UsuarioEliminadoError,
    );
    expect(() => u.cambiarContrasena('otro', DESPUES)).toThrow(
      UsuarioEliminadoError,
    );
    expect(() => u.eliminar(1, DESPUES)).toThrow(UsuarioEliminadoError);
  });

  it('se restaura desactivado y con el correo que se indique', () => {
    const u = UsuarioEntity.hydrate(fila());
    u.eliminar(1, AHORA);
    u.restaurar('Nuevo@Correo.test', DESPUES);

    expect(u.toPrimitives()).toMatchObject({
      correo: 'nuevo@correo.test',
      correoEliminado: null,
      eliminadoEn: null,
      eliminadoPorId: null,
      activo: false,
    });
  });

  it('solo se restaura un eliminado', () => {
    expect(() =>
      UsuarioEntity.hydrate(fila()).restaurar('ana@correo.test', DESPUES),
    ).toThrow(UsuarioNoEliminadoError);
  });

  it('toPrimitives devuelve copias', () => {
    const u = UsuarioEntity.hydrate(fila());
    u.toPrimitives().creadoEn.setFullYear(2000);

    expect(u.toPrimitives().creadoEn).toEqual(AHORA);
  });
});
