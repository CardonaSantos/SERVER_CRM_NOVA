import {
  CampaniaMensaje,
  EstadoCampaniaMensaje,
  EstadoEnvioMensaje,
  Prisma,
} from '@prisma/client';
import { CampaniaEntity } from '../../domain/entities/campania.entity';
import { EstadoCampania, EstadoEnvio } from '../../domain/enums/campania.enum';

export class CampaniaPrismaMapper {
  static toDomain(record: CampaniaMensaje): CampaniaEntity {
    return CampaniaEntity.hydrate({
      id: record.id,
      plantilla: record.plantilla,
      idioma: record.idioma,
      imagenUrl: record.imagenUrl,
      estado: CampaniaPrismaMapper.estado(record.estado),
      creadoPorId: record.creadoPorId,
      creadoEn: record.creadoEn,
      actividadEn: record.actividadEn,
      finalizadaEn: record.finalizadaEn,
    });
  }

  static toCreatePersistence(
    entity: CampaniaEntity,
  ): Prisma.CampaniaMensajeUncheckedCreateInput {
    const p = entity.toPrimitives();
    return {
      plantilla: p.plantilla,
      idioma: p.idioma,
      imagenUrl: p.imagenUrl,
      estado: p.estado as EstadoCampaniaMensaje,
      creadoPorId: p.creadoPorId,
      creadoEn: p.creadoEn,
      actividadEn: p.actividadEn,
      finalizadaEn: p.finalizadaEn,
    };
  }

  static estado(estado: EstadoCampaniaMensaje): EstadoCampania {
    return estado as EstadoCampania;
  }

  static estadoEnvio(estado: EstadoEnvioMensaje): EstadoEnvio {
    return estado as EstadoEnvio;
  }
}
