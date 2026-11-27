import { Sector } from '@prisma/client';
import { SectorEntity } from '../../domain/entities/sector.entity';

export class SectorPrismaMapper {
  static toDomain(record: Sector): SectorEntity {
    return SectorEntity.hydrate({
      id: record.id,
      nombre: record.nombre,
      descripcion: record.descripcion,
      municipioId: record.municipioId,
      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
      eliminadoEn: record.eliminadoEn,
      eliminadoPorId: record.eliminadoPorId,
    });
  }

  static toCreatePersistence(entity: SectorEntity) {
    return {
      ...this.toUpdatePersistence(entity),
      creadoEn: entity.toPrimitives().creadoEn,
    };
  }

  static toUpdatePersistence(entity: SectorEntity) {
    const props = entity.toPrimitives();

    return {
      nombre: props.nombre,
      descripcion: props.descripcion,
      municipioId: props.municipioId,
      actualizadoEn: props.actualizadoEn,
    };
  }
}
