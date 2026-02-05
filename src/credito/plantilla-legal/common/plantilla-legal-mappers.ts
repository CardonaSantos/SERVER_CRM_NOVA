import { PlantillaLegal as PrismaPlantillaLegal } from '@prisma/client';
import { PlantillaLegal } from '../entities/plantilla-legal.entity';

export class PlantillaLegalMapper {
  static toDomain(raw: PrismaPlantillaLegal): PlantillaLegal {
    return PlantillaLegal.rehidratar({
      id: raw.id,
      tipo: raw.tipo,
      nombre: raw.nombre,
      contenido: raw.contenido,
      version: raw.version,
      activa: raw.activa,
      creadoEn: raw.creadoEn,
      actualizadoEn: raw.actualizadoEn,
    });
  }

  static toPersistence(entity: PlantillaLegal) {
    return {
      tipo: entity.tipo,
      nombre: entity.nombre,
      contenido: entity.contenido,
      version: entity.version,
      activa: entity.activa,
    };
  }
}
