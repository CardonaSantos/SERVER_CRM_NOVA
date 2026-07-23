import {
  Prisma,
  type ClienteAccesoInternet as PrismaClienteAccesoInternet,
} from '@prisma/client';

import { ClienteAccesoInternetEntity } from '../../domain/entities/ppoe-acceso-internet.entity';

import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from '../../domain/enums/ppoe-acceso-internet.enum';

export class ClienteAccesoInternetPrismaMapper {
  static toDomain(
    record: PrismaClienteAccesoInternet,
  ): ClienteAccesoInternetEntity {
    return ClienteAccesoInternetEntity.hydrate({
      id: record.id,

      empresaId: record.empresaId,
      clienteId: record.clienteId,
      servicioInternetId: record.servicioInternetId,

      tecnologia: record.tecnologia as TecnologiaAccesoInternet,

      metodoAutenticacion:
        record.metodoAutenticacion as MetodoAutenticacionInternet,

      estado: record.estado as EstadoAccesoInternet,

      activadoEn: record.activadoEn,
      suspendidoEn: record.suspendidoEn,
      dadoDeBajaEn: record.dadoDeBajaEn,

      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
    });
  }

  static toCreatePersistence(
    entity: ClienteAccesoInternetEntity,
  ): Prisma.ClienteAccesoInternetUncheckedCreateInput {
    const props = entity.toPrimitives();

    return {
      clienteId: props.clienteId,
      servicioInternetId: props.servicioInternetId ?? null,
      empresaId: props.empresaId,

      tecnologia: props.tecnologia,

      metodoAutenticacion: props.metodoAutenticacion,

      estado: props.estado,

      activadoEn: props.activadoEn ?? null,
      suspendidoEn: props.suspendidoEn ?? null,
      dadoDeBajaEn: props.dadoDeBajaEn ?? null,
    };
  }

  static toUpdatePersistence(
    entity: ClienteAccesoInternetEntity,
  ): Prisma.ClienteAccesoInternetUncheckedUpdateInput {
    const props = entity.toPrimitives();

    return {
      servicioInternetId: props.servicioInternetId ?? null,

      tecnologia: props.tecnologia,

      metodoAutenticacion: props.metodoAutenticacion,

      estado: props.estado,

      activadoEn: props.activadoEn ?? null,
      suspendidoEn: props.suspendidoEn ?? null,
      dadoDeBajaEn: props.dadoDeBajaEn ?? null,
    };
  }
}
