import { ClienteInstalacionMedia } from '@prisma/client';
import { ClienteInstalacionMediaEntity } from '../../domain/entities/cliente-instalacion-media.entity';
import { TipoEvidenciaClienteOperacion } from '../../domain/enums/tipo-evidencia-cliente-operacion.enum';

export class ClienteInstalacionMediaPrismaMapper {
  /**
   * RECIBE UN REGISTRO DE PRISMA Y PASA A ENTIDAD
   * @param record Registro de Prisma
   * @returns
   */
  static toDomain(
    record: ClienteInstalacionMedia,
  ): ClienteInstalacionMediaEntity {
    return ClienteInstalacionMediaEntity.hydrate({
      id: record.id,
      instalacionId: record.instalacionId,
      mediaId: record.mediaId,
      tipo: record.tipo as TipoEvidenciaClienteOperacion,
      descripcion: record.descripcion,
      orden: record.orden,
      creadoEn: record.creadoEn,
    });
  }

  /**
   * RECIBE UNA ENTIDAD Y PASA A UN OBJ DE PRISMA
   * @param entity Entidad en Runtime
   * @returns
   */
  static toCreatePersistence(entity: ClienteInstalacionMediaEntity) {
    const props = entity.toPrimitives();

    return {
      instalacionId: props.instalacionId,
      mediaId: props.mediaId,
      tipo: props.tipo,
      descripcion: props.descripcion,
      orden: props.orden,
      creadoEn: props.creadoEn,
    };
  }
}
