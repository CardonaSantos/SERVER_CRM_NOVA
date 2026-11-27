import {
  Prisma,
  RolUsuario as RolUsuarioPrisma,
  Usuario as UsuarioRecord,
} from '@prisma/client';
import { UsuarioEntity } from '../../domain/entities/usuario.entity';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';

export class UsuarioPrismaMapper {
  static rolDeDominio(rol: RolUsuarioPrisma): RolUsuario {
    return RolUsuario[rol];
  }

  static rolPersistido(rol: RolUsuario): RolUsuarioPrisma {
    return RolUsuarioPrisma[rol];
  }

  static toDomain(record: UsuarioRecord): UsuarioEntity {
    return UsuarioEntity.hydrate({
      id: record.id,
      empresaId: record.empresaId,
      nombre: record.nombre,
      correo: record.correo,
      telefono: record.telefono ?? null,
      rol: UsuarioPrismaMapper.rolDeDominio(record.rol),
      activo: record.activo,
      contrasenaHash: record.contrasena,
      creadoEn: new Date(record.creadoEn),
      actualizadoEn: new Date(record.actualizadoEn),
      eliminadoEn: record.eliminadoEn ? new Date(record.eliminadoEn) : null,
      eliminadoPorId: record.eliminadoPorId ?? null,
      correoEliminado: record.correoEliminado ?? null,
    });
  }

  static toCreatePersistence(
    entity: UsuarioEntity,
  ): Prisma.UsuarioUncheckedCreateInput {
    const u = entity.toPrimitives();

    return {
      empresaId: u.empresaId,
      nombre: u.nombre,
      correo: u.correo,
      telefono: u.telefono,
      rol: UsuarioPrismaMapper.rolPersistido(u.rol),
      activo: u.activo,
      contrasena: u.contrasenaHash,
      creadoEn: u.creadoEn,
    };
  }

  static toUpdatePersistence(
    entity: UsuarioEntity,
  ): Prisma.UsuarioUncheckedUpdateManyInput {
    const u = entity.toPrimitives();

    return {
      nombre: u.nombre,
      correo: u.correo,
      telefono: u.telefono,
      rol: UsuarioPrismaMapper.rolPersistido(u.rol),
      activo: u.activo,
      contrasena: u.contrasenaHash,
      eliminadoEn: u.eliminadoEn,
      eliminadoPorId: u.eliminadoPorId,
      correoEliminado: u.correoEliminado,
    };
  }
}
