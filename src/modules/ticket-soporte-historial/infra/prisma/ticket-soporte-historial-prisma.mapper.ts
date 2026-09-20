import {
  Prisma,
  TicketSoporteHistorial as PrismaTicketSoporteHistorial,
  TipoCambioTicket as PrismaTipoCambioTicket,
} from '@prisma/client';
import { TicketSoporteHistorialEntity } from '../../domain/entities/ticket-soporte-historial.entity';
import { TicketSoporteHistorialTipo } from '../../domain/enums/ticket-soporte-historial-tipo.enum';

const DOMAIN_TO_PRISMA: Record<
  TicketSoporteHistorialTipo,
  PrismaTipoCambioTicket
> = {
  [TicketSoporteHistorialTipo.CREADO]: PrismaTipoCambioTicket.CREADO,
  [TicketSoporteHistorialTipo.ACTUALIZADO]: PrismaTipoCambioTicket.ACTUALIZADO,
  [TicketSoporteHistorialTipo.ESTADO_CAMBIADO]:
    PrismaTipoCambioTicket.ESTADO_CAMBIADO,
  [TicketSoporteHistorialTipo.PRIORIDAD_CAMBIADA]:
    PrismaTipoCambioTicket.PRIORIDAD_CAMBIADA,
  [TicketSoporteHistorialTipo.ASIGNACION_CAMBIADA]:
    PrismaTipoCambioTicket.ASIGNACION_CAMBIADA,
  [TicketSoporteHistorialTipo.CANCELADO]: PrismaTipoCambioTicket.CANCELADO,
  [TicketSoporteHistorialTipo.REABIERTO]: PrismaTipoCambioTicket.REABIERTO,
  [TicketSoporteHistorialTipo.FIJADO]: PrismaTipoCambioTicket.FIJADO,
  [TicketSoporteHistorialTipo.DESFIJADO]: PrismaTipoCambioTicket.DESFIJADO,
};

const PRISMA_TO_DOMAIN: Record<
  PrismaTipoCambioTicket,
  TicketSoporteHistorialTipo
> = {
  [PrismaTipoCambioTicket.CREADO]: TicketSoporteHistorialTipo.CREADO,
  [PrismaTipoCambioTicket.ACTUALIZADO]: TicketSoporteHistorialTipo.ACTUALIZADO,
  [PrismaTipoCambioTicket.ESTADO_CAMBIADO]:
    TicketSoporteHistorialTipo.ESTADO_CAMBIADO,
  [PrismaTipoCambioTicket.PRIORIDAD_CAMBIADA]:
    TicketSoporteHistorialTipo.PRIORIDAD_CAMBIADA,
  [PrismaTipoCambioTicket.ASIGNACION_CAMBIADA]:
    TicketSoporteHistorialTipo.ASIGNACION_CAMBIADA,
  [PrismaTipoCambioTicket.CANCELADO]: TicketSoporteHistorialTipo.CANCELADO,
  [PrismaTipoCambioTicket.REABIERTO]: TicketSoporteHistorialTipo.REABIERTO,
  [PrismaTipoCambioTicket.FIJADO]: TicketSoporteHistorialTipo.FIJADO,
  [PrismaTipoCambioTicket.DESFIJADO]: TicketSoporteHistorialTipo.DESFIJADO,
};

export class TicketSoporteHistorialPrismaMapper {
  static toDomain(
    row: PrismaTicketSoporteHistorial,
  ): TicketSoporteHistorialEntity {
    return TicketSoporteHistorialEntity.rehydrate({
      id: row.id,
      ticketId: row.ticketId,
      usuarioId: row.usuarioId,
      tipo: PRISMA_TO_DOMAIN[row.tipo],
      descripcion: row.descripcion,
      usuarioNombre: row.usuarioNombre,
      creadoEn: row.creadoEn,
    });
  }

  static toCreateInput(
    entity: TicketSoporteHistorialEntity,
  ): Prisma.TicketSoporteHistorialUncheckedCreateInput {
    return {
      ticketId: entity.ticketId,
      usuarioId: entity.usuarioId,
      tipo: DOMAIN_TO_PRISMA[entity.tipo],
      descripcion: entity.descripcion,
      usuarioNombre: entity.usuarioNombre,
      creadoEn: entity.creadoEn,
    };
  }

  static toPrismaTipo(
    tipo: TicketSoporteHistorialTipo,
  ): PrismaTipoCambioTicket {
    return DOMAIN_TO_PRISMA[tipo];
  }
}
