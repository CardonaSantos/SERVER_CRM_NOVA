import { PppoePerfilHomologacion, Prisma } from '@prisma/client';
import { PerfilHomologacionEntity } from '../../domain/entities/ppoe-perfil-homologacion.entity';

export class PerfilHomologacionPrismaMapper {
  /**
   * Convierte un registro obtenido desde Prisma
   * en una entidad de dominio.
   */
  static toDomain(record: PppoePerfilHomologacion): PerfilHomologacionEntity {
    return PerfilHomologacionEntity.hydrate({
      id: record.id,

      empresaId: record.empresaId,

      mikrotikRouterId: record.mikrotikRouterId,

      servicioInternetId: record.servicioInternetId,

      codigoPerfil: record.codigoPerfil,
      activo: record.activo,

      creadoPorId: record.creadoPorId ?? null,

      actualizadoPorId: record.actualizadoPorId ?? null,

      creadoEn: new Date(record.creadoEn),

      actualizadoEn: new Date(record.actualizadoEn),
    });
  }

  /**
   * Convierte una entidad nueva en un objeto prisma
   *
   */
  static toCreatePersistence(
    entity: PerfilHomologacionEntity,
  ): Prisma.PppoePerfilHomologacionUncheckedCreateInput {
    const props = entity.toPrimitives();

    if (props.id !== null) {
      throw new Error(
        'No se puede crear un perfil homologado que ya tiene un identificador.',
      );
    }

    return {
      empresaId: props.empresaId,

      mikrotikRouterId: props.mikrotikRouterId,

      servicioInternetId: props.servicioInternetId,

      codigoPerfil: props.codigoPerfil,

      activo: props.activo,

      creadoPorId: props.creadoPorId ?? null,

      actualizadoPorId: props.actualizadoPorId ?? null,
    };
  }

  /**
   * Convierte una entidad persistida en un objeto
   * compatible con Prisma update().
   *
   * Solo incluye los campos que la entidad permite modificar.
   */
  static toUpdatePersistence(
    entity: PerfilHomologacionEntity,
  ): Prisma.PppoePerfilHomologacionUncheckedUpdateInput {
    const props = entity.toPrimitives();

    if (props.id === null) {
      throw new Error(
        'No se puede actualizar un perfil homologado que no está persistido.',
      );
    }

    return {
      codigoPerfil: props.codigoPerfil,
      activo: props.activo,
      actualizadoPorId: props.actualizadoPorId ?? null,
    };
  }
}
