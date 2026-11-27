import { EstadoServicio as EstadoPrisma, TipoServicio } from '@prisma/client';
import { TipoServicioEntity } from '../../domain/entities/tipo-servicio.entity';
import { EstadoServicio } from '../../domain/enums/estado-servicio.enum';

export class TipoServicioPrismaMapper {
  static toDomain(record: TipoServicio): TipoServicioEntity {
    return TipoServicioEntity.hydrate({
      id: record.id,
      nombre: record.nombre,
      descripcion: record.descripcion,
      estado: record.estado as string as EstadoServicio,
      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
    });
  }

  static toCreatePersistence(entity: TipoServicioEntity) {
    const props = entity.toPrimitives();

    return {
      nombre: props.nombre,
      descripcion: props.descripcion,
      estado: props.estado as string as EstadoPrisma,
      creadoEn: props.creadoEn,
      actualizadoEn: props.actualizadoEn,
    };
  }
}
