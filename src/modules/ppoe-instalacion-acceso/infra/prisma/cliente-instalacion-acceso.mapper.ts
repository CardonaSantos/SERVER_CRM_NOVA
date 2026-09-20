import {
  Prisma,
  type ClienteInstalacionAcceso as PrismaClienteInstalacionAcceso,
} from '@prisma/client';
import { ClienteInstalacionAccesoEntity } from '../../domain/entities/ppoe-instalacion-acceso.entity';
import { AccionInstalacionAcceso } from '../../domain/enums/ppoe-instalacion-acceso.enum';

export class ClienteInstalacionAccesoPrismaMapper {
  static toDomain(
    record: PrismaClienteInstalacionAcceso,
  ): ClienteInstalacionAccesoEntity {
    return ClienteInstalacionAccesoEntity.hydrate({
      id: record.id,

      instalacionId: record.instalacionId,
      accesoInternetId: record.accesoInternetId,

      accion: record.accion as AccionInstalacionAcceso,

      creadoEn: record.creadoEn,
    });
  }

  static toCreatePersistence(
    entity: ClienteInstalacionAccesoEntity,
  ): Prisma.ClienteInstalacionAccesoUncheckedCreateInput {
    const props = entity.toPrimitives();

    return {
      instalacionId: props.instalacionId,
      accesoInternetId: props.accesoInternetId,

      accion: props.accion,
    };
  }
}
