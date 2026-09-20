import {
  ClienteDesinstalacionMedia as PrismaClienteDesinstalacionMedia,
  Prisma,
} from '@prisma/client';

import { ClienteDesinstalacionMediaEntity } from '../../domain/entities/cliente-desinstalacion-media.entity';
import { TipoEvidenciaClienteOperacion } from 'src/modules/cliente-instalacion/domain/enums/tipo-evidencia-cliente-operacion.enum';

export class ClienteDesinstalacionMediaPrismaMapper {
  static toDomain(
    record: PrismaClienteDesinstalacionMedia,
  ): ClienteDesinstalacionMediaEntity {
    return ClienteDesinstalacionMediaEntity.fromPrimitives({
      id: record.id,

      desinstalacionId: record.desinstalacionId,

      mediaId: record.mediaId,

      tipo: record.tipo as TipoEvidenciaClienteOperacion,

      descripcion: record.descripcion,

      orden: record.orden,

      creadoEn: record.creadoEn,
    });
  }

  static toCreatePersistence(
    entity: ClienteDesinstalacionMediaEntity,
  ): Prisma.ClienteDesinstalacionMediaUncheckedCreateInput {
    const props = entity.toPrimitives();

    return {
      desinstalacionId: props.desinstalacionId,

      mediaId: props.mediaId,

      tipo: props.tipo,

      descripcion: props.descripcion,

      orden: props.orden,

      creadoEn: props.creadoEn,
    };
  }
}
