import { EstadoMetaTicket, MetaTecnicoTicket, Prisma } from '@prisma/client';
import {
  fechaNegocioDe,
  inicioDiaNegocio,
} from 'src/common/reloj/fecha-negocio';
import { MetaTicketEntity } from '../../domain/entities/meta-ticket.entity';
import { MetaTicketReadModel } from '../../domain/read-models/meta-ticket.read-model';

export const SELECT_META_CON_TECNICO = {
  id: true,
  titulo: true,
  fechaInicio: true,
  fechaFin: true,
  metaTickets: true,
  estado: true,
  creadoEn: true,
  actualizadoEn: true,
  tecnico: { select: { id: true, nombre: true, activo: true } },
} satisfies Prisma.MetaTecnicoTicketSelect;

type MetaConTecnico = Prisma.MetaTecnicoTicketGetPayload<{
  select: typeof SELECT_META_CON_TECNICO;
}>;

/**
 * De la columna `estado` solo importa `CANCELADO`. `ticketsResueltos`,
 * `cumplida` y `fechaCumplida` ya no se leen ni se escriben: se calculan.
 */
export class MetaTicketPrismaMapper {
  static toDomain(record: MetaTecnicoTicket): MetaTicketEntity {
    return MetaTicketEntity.hydrate({
      id: record.id,
      tecnicoId: record.tecnicoId,
      titulo: record.titulo,
      fechaInicio: fechaNegocioDe(record.fechaInicio),
      fechaFin: fechaNegocioDe(record.fechaFin),
      objetivo: record.metaTickets,
      cancelada: record.estado === EstadoMetaTicket.CANCELADO,
      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
    });
  }

  static toReadModel(record: MetaConTecnico): MetaTicketReadModel {
    return {
      id: record.id,
      titulo: record.titulo,
      tecnico: record.tecnico,
      fechaInicio: fechaNegocioDe(record.fechaInicio),
      fechaFin: fechaNegocioDe(record.fechaFin),
      objetivo: record.metaTickets,
      cancelada: record.estado === EstadoMetaTicket.CANCELADO,
      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
    };
  }

  static toCreatePersistence(
    meta: MetaTicketEntity,
  ): Prisma.MetaTecnicoTicketUncheckedCreateInput {
    const props = meta.toPrimitives();

    return {
      tecnicoId: props.tecnicoId,
      estado: EstadoMetaTicket.ABIERTO,
      creadoEn: props.creadoEn,
      ...MetaTicketPrismaMapper.editables(meta),
    };
  }

  /** El estado antiguo de una meta vigente se conserva tal cual. */
  static toUpdatePersistence(meta: MetaTicketEntity) {
    const { cancelada } = meta.toPrimitives();

    return {
      ...MetaTicketPrismaMapper.editables(meta),
      ...(cancelada ? { estado: EstadoMetaTicket.CANCELADO } : {}),
    };
  }

  private static editables(meta: MetaTicketEntity) {
    const props = meta.toPrimitives();

    return {
      titulo: props.titulo,
      fechaInicio: inicioDiaNegocio(props.fechaInicio),
      fechaFin: inicioDiaNegocio(props.fechaFin),
      metaTickets: props.objetivo,
      actualizadoEn: props.actualizadoEn,
    };
  }
}
