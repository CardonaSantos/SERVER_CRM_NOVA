import {
  Prisma,
  TicketConformidad as PrismaTicketConformidad,
  TicketConformidadResultado as PrismaTicketConformidadResultado,
} from '@prisma/client';
import { TicketConformidadEntity } from '../../domain/entities/ticket-conformidad.entity';
import { TicketConformidadResultado } from '../../domain/enums/ticket-conformidad-resultado.enum';

export class TicketConformidadPrismaMapper {
  private constructor() {}

  static toDomain(record: PrismaTicketConformidad): TicketConformidadEntity {
    return TicketConformidadEntity.rehydrate({
      id: record.id,

      ticketId: record.ticketId,
      clienteId: record.clienteId,
      tecnicoAsignadoId: record.tecnicoAsignadoId,
      creadoPorId: record.creadoPorId,

      resultado: this.resultadoToDomain(record.resultado),

      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
      respondidoEn: record.respondidoEn,
    });
  }

  static toCreatePersistence(
    entity: TicketConformidadEntity,
  ): Prisma.TicketConformidadUncheckedCreateInput {
    const props = entity.toPrimitives();

    return {
      ticketId: props.ticketId,

      clienteId: props.clienteId,
      tecnicoAsignadoId: props.tecnicoAsignadoId,
      creadoPorId: props.creadoPorId,

      resultado: this.resultadoToPrisma(props.resultado),

      creadoEn: props.creadoEn,
      actualizadoEn: props.actualizadoEn,
      respondidoEn: props.respondidoEn,
    };
  }

  static toUpdatePersistence(
    entity: TicketConformidadEntity,
  ): Prisma.TicketConformidadUncheckedUpdateInput {
    const props = entity.toPrimitives();

    return {
      resultado: this.resultadoToPrisma(props.resultado),
      actualizadoEn: props.actualizadoEn,
      respondidoEn: props.respondidoEn,
    };
  }

  private static resultadoToDomain(
    value: PrismaTicketConformidadResultado,
  ): TicketConformidadResultado {
    switch (value) {
      case PrismaTicketConformidadResultado.PENDIENTE:
        return TicketConformidadResultado.PENDIENTE;

      case PrismaTicketConformidadResultado.CONFORME:
        return TicketConformidadResultado.CONFORME;

      case PrismaTicketConformidadResultado.REQUIERE_RETRABAJO:
        return TicketConformidadResultado.REQUIERE_RETRABAJO;
    }
  }

  static resultadoToPrisma(
    value: TicketConformidadResultado,
  ): PrismaTicketConformidadResultado {
    switch (value) {
      case TicketConformidadResultado.PENDIENTE:
        return PrismaTicketConformidadResultado.PENDIENTE;

      case TicketConformidadResultado.CONFORME:
        return PrismaTicketConformidadResultado.CONFORME;

      case TicketConformidadResultado.REQUIERE_RETRABAJO:
        return PrismaTicketConformidadResultado.REQUIERE_RETRABAJO;
    }
  }
}
