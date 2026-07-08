import { ClienteDesinstalacionAutorizacion, Prisma } from '@prisma/client';
import { ClienteDesinstalacionAutorizacionEntity } from '../../domain/entities/cliente-desintalacion-autorizacion.entitie';
import { EstadoAutorizacionDesinstalacion } from '../../domain/enums/estado-autorizacion-desintalacion.enum';

export class ClienteDesinstalacionAutorizacionPrismaMapper {
  static toDomain(
    record: ClienteDesinstalacionAutorizacion,
  ): ClienteDesinstalacionAutorizacionEntity {
    return ClienteDesinstalacionAutorizacionEntity.hydrate({
      id: record.id,
      desinstalacionId: record.desinstalacionId,
      solicitadoPorId: record.solicitadoPorId,
      autorizadoPorId: record.autorizadoPorId,
      estado: record.estado as EstadoAutorizacionDesinstalacion,
      motivoSolicitud: record.motivoSolicitud,
      comentarioAutorizador: record.comentarioAutorizador,
      fechaSolicitud: record.fechaSolicitud,
      fechaRespuesta: record.fechaRespuesta,
    });
  }

  static toCreatePersistence(
    entity: ClienteDesinstalacionAutorizacionEntity,
  ): Prisma.ClienteDesinstalacionAutorizacionUncheckedCreateInput {
    const props = entity.toPrimitives();

    return {
      desinstalacionId: props.desinstalacionId,
      solicitadoPorId: props.solicitadoPorId ?? null,
      autorizadoPorId: props.autorizadoPorId ?? null,
      estado: props.estado,
      motivoSolicitud: props.motivoSolicitud ?? null,
      comentarioAutorizador: props.comentarioAutorizador ?? null,
      fechaSolicitud: props.fechaSolicitud ?? new Date(),
      fechaRespuesta: props.fechaRespuesta ?? null,
    };
  }

  static toUpdatePersistence(
    entity: ClienteDesinstalacionAutorizacionEntity,
  ): Prisma.ClienteDesinstalacionAutorizacionUncheckedUpdateInput {
    const props = entity.toPrimitives();

    return {
      solicitadoPorId: props.solicitadoPorId ?? null,
      autorizadoPorId: props.autorizadoPorId ?? null,
      estado: props.estado,
      motivoSolicitud: props.motivoSolicitud ?? null,
      comentarioAutorizador: props.comentarioAutorizador ?? null,
      fechaRespuesta: props.fechaRespuesta ?? null,
    };
  }
}
