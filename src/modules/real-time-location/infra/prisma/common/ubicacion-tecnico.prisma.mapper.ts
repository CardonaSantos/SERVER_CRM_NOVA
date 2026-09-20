import { Prisma, UbicacionTecnico } from '@prisma/client';
import { UbicacionTecnicoEntity } from 'src/modules/real-time-location/domain/entities/ubicacion-tecnico.entity';

export class UbicacionTecnicoPrismaMapper {
  // PRISMA -> DOMAIN

  static toDomain(record: UbicacionTecnico): UbicacionTecnicoEntity {
    return UbicacionTecnicoEntity.hydrate({
      id: record.id,

      /*
       * Prisma conserva el nombre histórico usuarioId.
       *
       * Dentro de este bounded context su significado
       * es tecnicoId.
       */
      tecnicoId: record.usuarioId,

      sesionTrackingId: record.sesionTrackingId,

      latitud: record.latitud,

      longitud: record.longitud,

      precision: record.precision,

      velocidad: record.velocidad,

      bateria: record.bateria,

      capturadoEn: record.capturadoEn,

      creadoEn: record.creadoEn,

      actualizadoEn: record.actualizadoEn,
    });
  }

  // DOMAIN -> CREATE

  static toCreatePersistence(
    entity: UbicacionTecnicoEntity,
  ): Prisma.UbicacionTecnicoUncheckedCreateInput {
    const props = entity.toPrimitives();

    /*
     * La base de datos mantiene estos campos
     * nullable únicamente por compatibilidad legacy.
     *
     * Todo punto nuevo del tracking debe poseerlos.
     */
    if (props.sesionTrackingId == null) {
      throw new Error(
        'No se puede persistir una ubicación nueva sin sesionTrackingId.',
      );
    }

    if (!props.capturadoEn) {
      throw new Error(
        'No se puede persistir una ubicación nueva sin capturadoEn.',
      );
    }

    return {
      /*
       * Traducción deliberada:
       *
       * dominio.tecnicoId
       *       ↓
       * Prisma.usuarioId
       */
      usuarioId: props.tecnicoId,

      sesionTrackingId: props.sesionTrackingId,

      latitud: props.latitud,

      longitud: props.longitud,

      precision: props.precision ?? null,

      velocidad: props.velocidad ?? null,

      bateria: props.bateria ?? null,

      capturadoEn: props.capturadoEn,
    };
  }
}
