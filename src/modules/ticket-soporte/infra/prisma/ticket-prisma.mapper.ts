import { Prisma } from '@prisma/client';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import { EstadoTicket } from '../../domain/enums/estado-ticket.enum';
import { PrioridadTicket } from '../../domain/enums/prioridad-ticket.enum';

export const TICKET_CON_RELACIONES = {
  asignaciones: { select: { tecnicoId: true }, orderBy: { id: 'asc' } },
  etiquetas: { select: { etiquetaId: true }, orderBy: { id: 'asc' } },
} satisfies Prisma.TicketSoporteInclude;

type Registro = Prisma.TicketSoporteGetPayload<{
  include: typeof TICKET_CON_RELACIONES;
}>;

export class TicketPrismaMapper {
  static toDomain(record: Registro): TicketEntity {
    return TicketEntity.hydrate({
      id: record.id,
      empresaId: record.empresaId,
      clienteId: record.clienteId,
      creadoPorId: record.creadoPorId,
      titulo: record.titulo,
      descripcion: record.descripcion,
      prioridad: record.prioridad as PrioridadTicket,
      estado: record.estado as EstadoTicket,
      fijado: record.fijado,
      tecnicoId: record.tecnicoId,
      apoyoIds: record.asignaciones
        .map((asignacion) => asignacion.tecnicoId)
        .filter((id) => id !== record.tecnicoId),
      etiquetaIds: record.etiquetas.map((relacion) => relacion.etiquetaId),
      fechaApertura: record.fechaApertura,
      fechaAsignacion: record.fechaAsignacion,
      fechaInicioAtencion: record.fechaInicioAtencion,
      fechaResolucionTecnico: record.fechaResolucionTecnico,
      fechaCierre: record.fechaCierre,
      canceladoEn: record.canceladoEn,
      canceladoPorId: record.canceladoPorId,
      motivoCancelacion: record.motivoCancelacion,
      actualizadoEn: record.actualizadoEn,
    });
  }

  /** Columnas propias del ticket, sin apoyos ni etiquetas. */
  static toPersistence(entity: TicketEntity) {
    const datos = entity.toPrimitives();

    return {
      empresaId: datos.empresaId,
      clienteId: datos.clienteId,
      creadoPorId: datos.creadoPorId,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      prioridad: datos.prioridad,
      estado: datos.estado,
      fijado: datos.fijado,
      tecnicoId: datos.tecnicoId,
      fechaApertura: datos.fechaApertura,
      fechaAsignacion: datos.fechaAsignacion,
      fechaInicioAtencion: datos.fechaInicioAtencion,
      fechaResolucionTecnico: datos.fechaResolucionTecnico,
      fechaCierre: datos.fechaCierre,
      canceladoEn: datos.canceladoEn,
      canceladoPorId: datos.canceladoPorId,
      motivoCancelacion: datos.motivoCancelacion,
      actualizadoEn: datos.actualizadoEn,
    };
  }
}
