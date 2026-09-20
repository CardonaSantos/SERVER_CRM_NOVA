import {
  Prisma,
  TicketConformidadCanal as PrismaTicketConformidadCanal,
  TicketConformidadEnlace as PrismaTicketConformidadEnlace,
} from '@prisma/client';
import { TicketConformidadEnlaceEntity } from '../../domain/entities/ticket-conformidad-enlace.entity';
import { TicketConformidadCanal } from '../../domain/enums/ticket-conformidad-canal.enum';

export class TicketConformidadEnlacePrismaMapper {
  private constructor() {}

  static toDomain(
    record: PrismaTicketConformidadEnlace,
  ): TicketConformidadEnlaceEntity {
    return TicketConformidadEnlaceEntity.rehydrate({
      id: record.id,

      conformidadId: record.conformidadId,

      tokenHash: record.tokenHash,

      canal: this.canalToDomain(record.canal),

      telefonoDestino: record.telefonoDestino,

      expiraEn: record.expiraEn,

      usadoEn: record.usadoEn,
      revocadoEn: record.revocadoEn,

      creadoPorId: record.creadoPorId,

      creadoEn: record.creadoEn,
    });
  }

  static toCreatePersistence(
    entity: TicketConformidadEnlaceEntity,
  ): Prisma.TicketConformidadEnlaceUncheckedCreateInput {
    const props = entity.toPrimitives();

    return {
      conformidadId: props.conformidadId,

      tokenHash: props.tokenHash,

      canal: this.canalToPrisma(props.canal),

      telefonoDestino: props.telefonoDestino,

      expiraEn: props.expiraEn,

      usadoEn: props.usadoEn,
      revocadoEn: props.revocadoEn,

      creadoPorId: props.creadoPorId,

      creadoEn: props.creadoEn,
    };
  }

  static toUpdatePersistence(
    entity: TicketConformidadEnlaceEntity,
  ): Prisma.TicketConformidadEnlaceUncheckedUpdateInput {
    const props = entity.toPrimitives();

    return {
      usadoEn: props.usadoEn,
      revocadoEn: props.revocadoEn,
    };
  }

  private static canalToDomain(
    value: PrismaTicketConformidadCanal,
  ): TicketConformidadCanal {
    switch (value) {
      case PrismaTicketConformidadCanal.LINK:
        return TicketConformidadCanal.LINK;

      case PrismaTicketConformidadCanal.QR:
        return TicketConformidadCanal.QR;

      case PrismaTicketConformidadCanal.WHATSAPP:
        return TicketConformidadCanal.WHATSAPP;
    }
  }

  private static canalToPrisma(
    value: TicketConformidadCanal,
  ): PrismaTicketConformidadCanal {
    switch (value) {
      case TicketConformidadCanal.LINK:
        return PrismaTicketConformidadCanal.LINK;

      case TicketConformidadCanal.QR:
        return PrismaTicketConformidadCanal.QR;

      case TicketConformidadCanal.WHATSAPP:
        return PrismaTicketConformidadCanal.WHATSAPP;
    }
  }
}
