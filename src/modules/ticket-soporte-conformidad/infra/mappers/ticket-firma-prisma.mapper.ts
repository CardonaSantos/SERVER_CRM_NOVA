import {
  Prisma,
  TicketFirma as PrismaTicketFirma,
  TicketFirmaOrigen as PrismaTicketFirmaOrigen,
  TicketFirmaTipo as PrismaTicketFirmaTipo,
} from '@prisma/client';
import { TicketFirmaEntity } from '../../domain/entities/ticket-firma.entity';
import { TicketFirmaTipo } from '../../domain/enums/ticket-firma-tipo.enum';
import { TicketFirmaOrigen } from '../../domain/enums/ticket-firma-origen.enum';

export class TicketFirmaPrismaMapper {
  private constructor() {}

  static toDomain(record: PrismaTicketFirma): TicketFirmaEntity {
    return TicketFirmaEntity.rehydrate({
      id: record.id,

      conformidadId: record.conformidadId,
      mediaId: record.mediaId,

      tipo: this.tipoToDomain(record.tipo),

      usuarioFirmanteId: record.usuarioFirmanteId,

      nombreFirmante: record.nombreFirmante,
      telefonoFirmante: record.telefonoFirmante,

      origen: this.origenToDomain(record.origen),

      ipOrigen: record.ipOrigen,
      userAgent: record.userAgent,

      firmadoEn: record.firmadoEn,
    });
  }

  static toCreatePersistence(
    entity: TicketFirmaEntity,
  ): Prisma.TicketFirmaUncheckedCreateInput {
    const props = entity.toPrimitives();

    return {
      conformidadId: props.conformidadId,
      mediaId: props.mediaId,

      tipo: this.tipoToPrisma(props.tipo),

      usuarioFirmanteId: props.usuarioFirmanteId,

      nombreFirmante: props.nombreFirmante,
      telefonoFirmante: props.telefonoFirmante,

      origen: this.origenToPrisma(props.origen),

      ipOrigen: props.ipOrigen,
      userAgent: props.userAgent,

      firmadoEn: props.firmadoEn,
    };
  }

  private static tipoToDomain(value: PrismaTicketFirmaTipo): TicketFirmaTipo {
    switch (value) {
      case PrismaTicketFirmaTipo.CLIENTE:
        return TicketFirmaTipo.CLIENTE;

      case PrismaTicketFirmaTipo.TECNICO:
        return TicketFirmaTipo.TECNICO;
    }
  }

  static tipoToPrisma(value: TicketFirmaTipo): PrismaTicketFirmaTipo {
    switch (value) {
      case TicketFirmaTipo.CLIENTE:
        return PrismaTicketFirmaTipo.CLIENTE;

      case TicketFirmaTipo.TECNICO:
        return PrismaTicketFirmaTipo.TECNICO;
    }
  }

  private static origenToDomain(
    value: PrismaTicketFirmaOrigen,
  ): TicketFirmaOrigen {
    switch (value) {
      case PrismaTicketFirmaOrigen.CRM:
        return TicketFirmaOrigen.CRM;

      case PrismaTicketFirmaOrigen.PUBLICO:
        return TicketFirmaOrigen.PUBLICO;
    }
  }

  private static origenToPrisma(
    value: TicketFirmaOrigen,
  ): PrismaTicketFirmaOrigen {
    switch (value) {
      case TicketFirmaOrigen.CRM:
        return PrismaTicketFirmaOrigen.CRM;

      case TicketFirmaOrigen.PUBLICO:
        return PrismaTicketFirmaOrigen.PUBLICO;
    }
  }
}
