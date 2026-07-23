import {
  ClientePppoeCuenta,
  EstadoCuentaPppoe as PrismaEstadoCuentaPppoe,
  Prisma,
} from '@prisma/client';

import { EstadoCuentaPppoe } from '../../domain/enums/pppoe-cliente-cuenta.enum';
import { ClientePppoeCuentaEntity } from '../../domain/entities/ppoe-cliente-cuenta.entity';

export class ClientePppoeCuentaPrismaMapper {
  static toDomain(record: ClientePppoeCuenta): ClientePppoeCuentaEntity {
    return ClientePppoeCuentaEntity.hydrate({
      id: record.id,

      empresaId: record.empresaId,

      accesoInternetId: record.accesoInternetId,

      perfilHomologacionId: record.perfilHomologacionId,

      usuario: record.usuario,

      secretoCifrado: record.secretoCifrado,

      secretoIv: record.secretoIv,

      secretoAuthTag: record.secretoAuthTag,

      versionClave: record.versionClave,

      estado: record.estado as EstadoCuentaPppoe,

      generadoPorId: record.generadoPorId ?? null,

      generadoEn: new Date(record.generadoEn),

      secretCreadoEn: record.secretCreadoEn
        ? new Date(record.secretCreadoEn)
        : null,

      activadoEn: record.activadoEn ? new Date(record.activadoEn) : null,

      suspendidoEn: record.suspendidoEn ? new Date(record.suspendidoEn) : null,

      eliminadoEn: record.eliminadoEn ? new Date(record.eliminadoEn) : null,

      ultimaSincronizacionEn: record.ultimaSincronizacionEn
        ? new Date(record.ultimaSincronizacionEn)
        : null,

      ultimoError: record.ultimoError ?? null,

      actualizadoEn: new Date(record.actualizadoEn),
    });
  }

  static toCreatePersistence(
    entity: ClientePppoeCuentaEntity,
  ): Prisma.ClientePppoeCuentaUncheckedCreateInput {
    const props = entity.toPrimitives();

    if (props.id !== null) {
      throw new Error(
        'No se puede crear una cuenta PPPoE que ya tiene identificador.',
      );
    }

    return {
      empresaId: props.empresaId,

      accesoInternetId: props.accesoInternetId,

      perfilHomologacionId: props.perfilHomologacionId,

      usuario: props.usuario,

      secretoCifrado: props.secretoCifrado,

      secretoIv: props.secretoIv,

      secretoAuthTag: props.secretoAuthTag,

      versionClave: props.versionClave,

      estado: props.estado as PrismaEstadoCuentaPppoe,

      generadoPorId: props.generadoPorId ?? null,
    };
  }

  /**
   *
   * Incluye solamente los campos que pueden cambiar
   * durante el ciclo de vida de la cuenta.
   */
  static toUpdatePersistence(
    entity: ClientePppoeCuentaEntity,
  ): Prisma.ClientePppoeCuentaUncheckedUpdateInput {
    const props = entity.toPrimitives();

    if (props.id === null) {
      throw new Error(
        'No se puede actualizar una cuenta PPPoE sin identificador.',
      );
    }

    return {
      secretoCifrado: props.secretoCifrado,

      secretoIv: props.secretoIv,

      secretoAuthTag: props.secretoAuthTag,

      versionClave: props.versionClave,

      estado: props.estado as PrismaEstadoCuentaPppoe,

      secretCreadoEn: props.secretCreadoEn ?? null,

      activadoEn: props.activadoEn ?? null,

      suspendidoEn: props.suspendidoEn ?? null,

      eliminadoEn: props.eliminadoEn ?? null,

      ultimaSincronizacionEn: props.ultimaSincronizacionEn ?? null,

      ultimoError: props.ultimoError ?? null,
    };
  }
}
