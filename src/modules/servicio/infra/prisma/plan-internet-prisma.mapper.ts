import {
  EstadoServicio as EstadoPrisma,
  ServicioInternet,
} from '@prisma/client';
import { PlanInternetEntity } from '../../domain/entities/plan-internet.entity';
import { EstadoServicio } from '../../domain/enums/estado-servicio.enum';

export class PlanInternetPrismaMapper {
  static toDomain(record: ServicioInternet): PlanInternetEntity {
    return PlanInternetEntity.hydrate({
      id: record.id,
      empresaId: record.empresaId,
      nombre: record.nombre,
      velocidad: record.velocidad,
      precio: record.precio,
      estado: record.estado as string as EstadoServicio,
      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
      eliminadoEn: record.eliminadoEn,
      eliminadoPorId: record.eliminadoPorId,
    });
  }

  static toCreatePersistence(entity: PlanInternetEntity) {
    const props = entity.toPrimitives();

    return {
      empresaId: props.empresaId,
      nombre: props.nombre,
      velocidad: props.velocidad,
      precio: props.precio,
      estado: props.estado as string as EstadoPrisma,
      creadoEn: props.creadoEn,
      actualizadoEn: props.actualizadoEn,
    };
  }

  /** Sin precio: se guarda solo con su propia operación. */
  static toUpdatePersistence(entity: PlanInternetEntity) {
    const props = entity.toPrimitives();

    return {
      nombre: props.nombre,
      velocidad: props.velocidad,
      estado: props.estado as string as EstadoPrisma,
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
