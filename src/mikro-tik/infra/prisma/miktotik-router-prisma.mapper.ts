import { MikrotikRouter as PrismaMikrotikRouter, Prisma } from '@prisma/client';
import { MikrotikRouterEntity } from 'src/mikro-tik/domain/entities/mikrotik-router-entity';

export class MikrotikRouterPrismaMapper {
  static toDomain(record: PrismaMikrotikRouter): MikrotikRouterEntity {
    return MikrotikRouterEntity.hydrate({
      id: record.id,

      empresaId: record.empresaId,

      nombre: record.nombre,

      host: record.host,

      sshPort: record.sshPort,

      usuario: record.usuario,

      descripcion: record.descripcion,

      activo: record.activo,

      oltId: record.oltId,

      passwordEnc: record.passwordEnc,

      creadoEn: record.creadoEn,

      actualizadoEn: record.actualizadoEn,
    });
  }

  static toCreatePersistence(
    entity: MikrotikRouterEntity,
  ): Prisma.MikrotikRouterUncheckedCreateInput {
    const props = entity.toPrimitives();

    return {
      empresaId: props.empresaId,

      nombre: props.nombre,

      host: props.host,

      sshPort: props.sshPort,

      usuario: props.usuario,

      descripcion: props.descripcion,

      activo: props.activo,

      oltId: props.oltId,

      passwordEnc: props.passwordEnc,
    };
  }

  static toUpdatePersistence(
    entity: MikrotikRouterEntity,
  ): Prisma.MikrotikRouterUncheckedUpdateInput {
    const props = entity.toPrimitives();

    return {
      nombre: props.nombre,

      host: props.host,

      sshPort: props.sshPort,

      usuario: props.usuario,

      descripcion: props.descripcion,

      activo: props.activo,

      oltId: props.oltId,

      passwordEnc: props.passwordEnc,
    };
  }
}
