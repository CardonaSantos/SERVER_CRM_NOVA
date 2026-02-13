import { UbicacionActual } from '@prisma/client';
import { RealTimeLocation } from '../entities/real-time.entity';

export class PrismaRealTimeMapper {
  static toDomain(prisma: UbicacionActual): RealTimeLocation {
    return RealTimeLocation.create({
      usuarioId: prisma.usuarioId,
      latitud: prisma.latitud,
      longitud: prisma.longitud,
      precision: prisma.precision ?? undefined,
      velocidad: prisma.velocidad ?? undefined,
      bateria: prisma.bateria ?? undefined,
      actualizadoEn: prisma.actualizadoEn,
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
