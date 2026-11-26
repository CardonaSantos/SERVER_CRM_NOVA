import {
  Prisma,
  TicketSoporteHistorial as PrismaTicketSoporteHistorial,
  TipoCambioTicket as PrismaTipoCambioTicket,
} from '@prisma/client';
import { TicketSoporteHistorialEntity } from '../../domain/entities/ticket-soporte-historial.entity';
import { TicketSoporteHistorialTipo } from '../../domain/enums/ticket-soporte-historial-tipo.enum';
import { TicketSoporteHistorialResumen } from '../../domain/read-models/ticket-soporte-historial.read-model';

const DOMINIO_A_PRISMA: Record<
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

const PRISMA_A_DOMINIO: Record<
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
    registro: PrismaTicketSoporteHistorial,
  ): TicketSoporteHistorialEntity {
    return TicketSoporteHistorialEntity.hydrate({
      id: registro.id,
      ticketId: registro.ticketId,
      usuarioId: registro.usuarioId,
      tipo: PRISMA_A_DOMINIO[registro.tipo],
      descripcion: registro.descripcion,
      usuarioNombre: registro.usuarioNombre,
      creadoEn: registro.creadoEn,
    });
  }

  static toResumen(
    registro: PrismaTicketSoporteHistorial,
  ): TicketSoporteHistorialResumen {
    return {
      id: registro.id,
      ticketId: registro.ticketId,
      usuarioId: registro.usuarioId,
      tipo: PRISMA_A_DOMINIO[registro.tipo],
      descripcion: registro.descripcion,
      usuarioNombre: registro.usuarioNombre,
      creadoEn: registro.creadoEn,
    };
  }

  static toCreatePersistence(
    entidad: TicketSoporteHistorialEntity,
  ): Prisma.TicketSoporteHistorialUncheckedCreateInput {
    return {
      ticketId: entidad.ticketId,
      usuarioId: entidad.usuarioId,
      tipo: DOMINIO_A_PRISMA[entidad.tipo],
      descripcion: entidad.descripcion,
      usuarioNombre: entidad.usuarioNombre,
      creadoEn: entidad.creadoEn,
    };
  }

  static toPrismaTipo(
    tipo: TicketSoporteHistorialTipo,
  ): PrismaTipoCambioTicket {
    return DOMINIO_A_PRISMA[tipo];
  }
}
