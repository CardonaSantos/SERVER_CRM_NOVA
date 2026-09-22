import { Prisma, Usuario as UsuarioRow } from '@prisma/client';
import { Usuario } from '../../domain/entities/usuario.entity';

export class PrismaUsuarioMapper {
  static toDomain(row: UsuarioRow): Usuario {
    return Usuario.rehydrate({
      id: row.id,
      empresaId: row.empresaId,
      nombre: row.nombre,
      correo: row.correo,
      telefono: row.telefono ?? null,
      rol: row.rol,
      activo: row.activo,
      contrasena: row.contrasena,
      creadoEn: row.creadoEn,
      actualizadoEn: row.actualizadoEn,
    });
  }

  static toCreate(usuario: Usuario): Prisma.UsuarioUncheckedCreateInput {
    const data = usuario.toObject();

    return {
      empresaId: data.empresaId,
      nombre: data.nombre,
      correo: data.correo,
      telefono: data.telefono,
      rol: data.rol,
      activo: data.activo,
      contrasena: data.contrasena,
    };
  }

  static toUpdate(usuario: Usuario): Prisma.UsuarioUncheckedUpdateInput {
    const data = usuario.toObject();

    return {
      nombre: data.nombre,
      correo: data.correo,
      telefono: data.telefono,
      rol: data.rol,
      activo: data.activo,
      contrasena: data.contrasena,
    };
  }
}
