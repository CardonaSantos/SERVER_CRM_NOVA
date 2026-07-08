import { ClienteDesinstalacionTecnico, Prisma } from '@prisma/client';
import { ClienteDesinstalacionTecnicoEntity } from '../../domain/entities/cliente-desinstalacion-tecnico.entity';
import { RolTecnicoOperacionCliente } from 'src/modules/cliente-instalacion/domain/enums/rol-tecnico-operacion-cliente.enum';
// import { ionCliente } from '../../domain/enums/rol-tecnico-operacion-cliente.enum';

export class ClienteDesinstalacionTecnicoPrismaMapper {
  static toDomain(
    record: ClienteDesinstalacionTecnico,
  ): ClienteDesinstalacionTecnicoEntity {
    return ClienteDesinstalacionTecnicoEntity.hydrate({
      id: record.id,
      desinstalacionId: record.desinstalacionId,
      tecnicoId: record.tecnicoId,

      rol: record.rol as RolTecnicoOperacionCliente,
      esResponsable: record.esResponsable,

      tiempoMinutos: record.tiempoMinutos,
      observaciones: record.observaciones,
      tecnicoNombreSnapshot: record.tecnicoNombreSnapshot,

      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
    });
  }

  static toCreatePersistence(
    entity: ClienteDesinstalacionTecnicoEntity,
  ): Prisma.ClienteDesinstalacionTecnicoUncheckedCreateInput {
    const props = entity.toPrimitives();

    return {
      desinstalacionId: props.desinstalacionId,
      tecnicoId: props.tecnicoId ?? null,

      rol: props.rol,
      esResponsable: props.esResponsable,

      tiempoMinutos: props.tiempoMinutos ?? null,
      observaciones: props.observaciones ?? null,
      tecnicoNombreSnapshot: props.tecnicoNombreSnapshot ?? null,
    };
  }
}
