import {
  EstadoTrackingTecnico as PrismaEstadoTrackingTecnico,
  Prisma,
  TecnicoTrackingSesion,
} from '@prisma/client';
import { TecnicoTrackingSesionEntity } from 'src/modules/real-time-location/domain/entities/real-time-location.entity';
import { EstadoTrackingTecnico } from 'src/modules/real-time-location/domain/enums/estado-tracking-tecnico.enum';

export class TecnicoTrackingSesionPrismaMapper {
  // PRISMA -> DOMAIN

  static toDomain(record: TecnicoTrackingSesion): TecnicoTrackingSesionEntity {
    return TecnicoTrackingSesionEntity.hydrate({
      id: record.id,

      tecnicoId: record.tecnicoId,

      asistenciaId: record.asistenciaId,

      iniciadoEn: record.iniciadoEn,

      finalizadoEn: record.finalizadoEn,

      ultimoHeartbeatEn: record.ultimoHeartbeatEn,

      estado: this.toDomainEstado(record.estado),

      creadoEn: record.creadoEn,

      actualizadoEn: record.actualizadoEn,
    });
  }

  // DOMAIN -> CREATE

  static toCreatePersistence(
    entity: TecnicoTrackingSesionEntity,
  ): Prisma.TecnicoTrackingSesionUncheckedCreateInput {
    const props = entity.toPrimitives();

    /*
     * El schema permite asistenciaId nullable
     * por compatibilidad histórica.
     *
     * El flujo nuevo NO permite crear una sesión
     * sin asistencia.
     */
    if (props.asistenciaId == null) {
      throw new Error(
        'No se puede persistir una nueva sesión de tracking sin asistenciaId.',
      );
    }

    return {
      tecnicoId: props.tecnicoId,

      asistenciaId: props.asistenciaId,

      iniciadoEn: props.iniciadoEn,

      finalizadoEn: props.finalizadoEn ?? null,

      ultimoHeartbeatEn: props.ultimoHeartbeatEn,

      estado: this.toPrismaEstado(props.estado),
    };
  }

  // DOMAIN -> UPDATE

  static toUpdatePersistence(
    entity: TecnicoTrackingSesionEntity,
  ): Prisma.TecnicoTrackingSesionUncheckedUpdateInput {
    const props = entity.toPrimitives();

    /*
     * tecnicoId, asistenciaId e iniciadoEn
     * son identidad/contexto histórico de la sesión.
     *
     * Una vez persistidos no deben modificarse
     * durante su ciclo de vida.
     */
    return {
      estado: this.toPrismaEstado(props.estado),

      finalizadoEn: props.finalizadoEn ?? null,

      ultimoHeartbeatEn: props.ultimoHeartbeatEn,
    };
  }

  // ENUM MAPPING

  static toDomainEstado(
    estado: PrismaEstadoTrackingTecnico,
  ): EstadoTrackingTecnico {
    switch (estado) {
      case PrismaEstadoTrackingTecnico.ACTIVA:
        return EstadoTrackingTecnico.ACTIVA;

      case PrismaEstadoTrackingTecnico.FINALIZADA:
        return EstadoTrackingTecnico.FINALIZADA;

      case PrismaEstadoTrackingTecnico.EXPIRADA:
        return EstadoTrackingTecnico.EXPIRADA;

      default:
        throw new Error(
          `EstadoTrackingTecnico de Prisma no soportado: ${String(estado)}.`,
        );
    }
  }

  static toPrismaEstado(
    estado: EstadoTrackingTecnico,
  ): PrismaEstadoTrackingTecnico {
    switch (estado) {
      case EstadoTrackingTecnico.ACTIVA:
        return PrismaEstadoTrackingTecnico.ACTIVA;

      case EstadoTrackingTecnico.FINALIZADA:
        return PrismaEstadoTrackingTecnico.FINALIZADA;

      case EstadoTrackingTecnico.EXPIRADA:
        return PrismaEstadoTrackingTecnico.EXPIRADA;

      default:
        throw new Error(
          `EstadoTrackingTecnico de dominio no soportado: ${String(estado)}.`,
        );
    }
  }
}
