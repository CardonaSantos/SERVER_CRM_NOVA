import { CreditoContrato as PrismaContrato } from '@prisma/client';
import { Contrato } from '../entities/contrato.entity';

export class ContratoMapper {
  static toDomain(raw: PrismaContrato): Contrato {
    return Contrato.rehidratar({
      id: raw.id,
      creditoId: raw.creditoId,
      contenido: raw.contenido,
      version: raw.version,
      firmadoEn: raw.firmadoEn,
      creadoEn: raw.creadoEn,
      actualizadoEn: raw.actualizadoEn,
    });
  }

  static toPersistence(entity: Contrato) {
    return {
      creditoId: entity.creditoId,
      contenido: entity.contenido,
      version: entity.version,
      firmadoEn: entity.firmadoEn,
    };
  }
}
