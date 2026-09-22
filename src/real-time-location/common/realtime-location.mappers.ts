import { RealTimeLocation } from '../entities/real-time.entity';
import { Usuario } from 'src/user/entities/user.entity';

import { UbicacionActual, Usuario as UsuarioPrisma } from '@prisma/client';

type UbicacionWithRelations = UbicacionActual & {
  usuario?: UsuarioPrisma | null;
};

export class PrismaRealTimeMapper {
  static toDomain(raw: UbicacionWithRelations): RealTimeLocation {
    const userDomain = raw.usuario
      ? Usuario.rehydrate({
          id: raw.usuario.id,
          empresaId: raw.usuario.empresaId,
          nombre: raw.usuario.nombre,
          correo: raw.usuario.correo,
          telefono: raw.usuario.telefono ?? null,
          rol: raw.usuario.rol,
          activo: raw.usuario.activo,
          contrasena: raw.usuario.contrasena,
          creadoEn: raw.usuario.creadoEn,
          actualizadoEn: raw.usuario.actualizadoEn,
        })
      : undefined;

    return RealTimeLocation.create({
      usuarioId: raw.usuarioId,
      latitud: raw.latitud,
      longitud: raw.longitud,
      precision: raw.precision ?? undefined,
      velocidad: raw.velocidad ?? undefined,
      bateria: raw.bateria ?? undefined,
      actualizadoEn: raw.actualizadoEn,
      usuario: userDomain,
    });
  }

  static toPersistence(entity: RealTimeLocation) {
    return {
      usuarioId: entity.usuarioId,
      latitud: entity.latitud,
      longitud: entity.longitud,
      precision: entity.precision ?? null,
      velocidad: entity.velocidad ?? null,
      bateria: entity.bateria ?? null,
    };
  }

  // 🔹 Dominio → Update parcial
  static toUpdate(entity: RealTimeLocation) {
    return {
      latitud: entity.latitud,
      longitud: entity.longitud,
      precision: entity.precision ?? null,
      velocidad: entity.velocidad ?? null,
      bateria: entity.bateria ?? null,
    };
  }
}
