import { EstadoRuta, Prisma, Ruta } from '@prisma/client';
import { RutaCobroEntity } from '../../domain/entities/ruta-cobro.entity';
import { EstadoRutaCobro } from '../../domain/enums/estado-ruta-cobro.enum';

export type RutaConClientes = Ruta & { clientes: { id: number }[] };

export class RutaCobroPrismaMapper {
  static toDomain(record: RutaConClientes): RutaCobroEntity {
    return RutaCobroEntity.hydrate({
      id: record.id,
      empresaId: record.empresaId,
      nombre: record.nombreRuta,
      cobradorId: record.cobradorId,
      estado: RutaCobroPrismaMapper.estado(record.estadoRuta),
      observaciones: record.observaciones,
      clienteIds: record.clientes.map((cliente) => cliente.id),
      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
      eliminadoEn: record.eliminadoEn,
      eliminadoPorId: record.eliminadoPorId,
    });
  }

  static toCreatePersistence(
    entity: RutaCobroEntity,
  ): Prisma.RutaUncheckedCreateInput {
    const props = entity.toPrimitives();

    return {
      empresaId: props.empresaId,
      nombreRuta: props.nombre,
      cobradorId: props.cobradorId,
      estadoRuta: RutaCobroPrismaMapper.estadoPrisma(props.estado),
      observaciones: props.observaciones,
      creadoEn: props.creadoEn,
      actualizadoEn: props.actualizadoEn,
      clientes: { connect: props.clienteIds.map((id) => ({ id })) },
    };
  }

  /** No incluye `montoCobrado`: lo cobrado sale de los pagos. */
  static toUpdatePersistence(
    entity: RutaCobroEntity,
    opciones: { clientes: boolean },
  ): Prisma.RutaUncheckedUpdateInput {
    const props = entity.toPrimitives();

    return {
      nombreRuta: props.nombre,
      cobradorId: props.cobradorId,
      estadoRuta: RutaCobroPrismaMapper.estadoPrisma(props.estado),
      observaciones: props.observaciones,
      actualizadoEn: props.actualizadoEn,
      eliminadoEn: props.eliminadoEn,
      eliminadoPorId: props.eliminadoPorId,
      ...(opciones.clientes && {
        clientes: { set: props.clienteIds.map((id) => ({ id })) },
      }),
    };
  }

  static estado(estado: EstadoRuta): EstadoRutaCobro {
    return estado as string as EstadoRutaCobro;
  }

  static estadoPrisma(estado: EstadoRutaCobro): EstadoRuta {
    return estado as string as EstadoRuta;
  }
}
