import { EstadoServicio as EstadoPrisma, Servicio } from '@prisma/client';
import { ServicioAdicionalEntity } from '../../domain/entities/servicio-adicional.entity';
import { EstadoServicio } from '../../domain/enums/estado-servicio.enum';

export class ServicioAdicionalPrismaMapper {
  static toDomain(record: Servicio): ServicioAdicionalEntity {
    return ServicioAdicionalEntity.hydrate({
      id: record.id,
      empresaId: record.empresaId,
      nombre: record.nombre,
      descripcion: record.descripcion,
      precio: record.precio,
      estado: record.estado as string as EstadoServicio,
      tipoServicioId: record.tipoServicioId,
      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
      eliminadoEn: record.eliminadoEn,
      eliminadoPorId: record.eliminadoPorId,
    });
  }

  static toCreatePersistence(entity: ServicioAdicionalEntity) {
    const props = entity.toPrimitives();

    return {
      empresaId: props.empresaId,
      ...this.toUpdatePersistence(entity),
      creadoEn: props.creadoEn,
    };
  }

  static toUpdatePersistence(entity: ServicioAdicionalEntity) {
    const props = entity.toPrimitives();

    return {
      nombre: props.nombre,
      descripcion: props.descripcion,
      precio: props.precio,
      estado: props.estado as string as EstadoPrisma,
      tipoServicioId: props.tipoServicioId,
      actualizadoEn: props.actualizadoEn,
    };
  }

  static estadoPersistido(estado: EstadoServicio): EstadoPrisma {
    return estado as string as EstadoPrisma;
  }

  static estadoDeDominio(estado: EstadoPrisma): EstadoServicio {
    return estado as string as EstadoServicio;
  }
}
