import { Injectable } from '@nestjs/common';
import { EstadoAutorizacionDesinstalacion as PrismaEstadoAutorizacion } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AutorizacionDesinstalacionPendiente,
  ClienteDesinstalacionAutorizacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-autorizacion.repository.port';
import { ClienteDesinstalacionAutorizacionEntity } from '../../domain/entities/cliente-desintalacion-autorizacion.entitie';
import { ClienteDesinstalacionAutorizacionPrismaMapper } from './cliente-desinstalacion-autorizacion.mapper';

@Injectable()
export class ClienteDesinstalacionAutorizacionPrismaRepository
  implements ClienteDesinstalacionAutorizacionRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: ClienteDesinstalacionAutorizacionEntity,
  ): Promise<ClienteDesinstalacionAutorizacionEntity> {
    const record = await this.prisma.clienteDesinstalacionAutorizacion.create({
      data: ClienteDesinstalacionAutorizacionPrismaMapper.toCreatePersistence(
        entity,
      ),
    });

    return ClienteDesinstalacionAutorizacionPrismaMapper.toDomain(record);
  }

  async findById(
    id: number,
  ): Promise<ClienteDesinstalacionAutorizacionEntity | null> {
    const record =
      await this.prisma.clienteDesinstalacionAutorizacion.findUnique({
        where: { id },
      });

    if (!record) return null;

    return ClienteDesinstalacionAutorizacionPrismaMapper.toDomain(record);
  }

  async findPendienteByDesinstalacionId(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionAutorizacionEntity | null> {
    const record =
      await this.prisma.clienteDesinstalacionAutorizacion.findFirst({
        where: {
          desinstalacionId,
          estado: PrismaEstadoAutorizacion.PENDIENTE,
        },
        orderBy: {
          fechaSolicitud: 'desc',
        },
      });

    if (!record) return null;

    return ClienteDesinstalacionAutorizacionPrismaMapper.toDomain(record);
  }

  async findPendientes(): Promise<AutorizacionDesinstalacionPendiente[]> {
    const records =
      await this.prisma.clienteDesinstalacionAutorizacion.findMany({
        where: {
          estado: PrismaEstadoAutorizacion.PENDIENTE,
        },
        include: {
          desinstalacion: {
            select: {
              id: true,
              clienteId: true,
              servicioInternetId: true,
              tipo: true,
              motivo: true,
              estado: true,
              fechaProgramada: true,
              observaciones: true,
            },
          },
        },
        orderBy: {
          fechaSolicitud: 'asc',
        },
      });

    return records.map((record) => ({
      autorizacion:
        ClienteDesinstalacionAutorizacionPrismaMapper.toDomain(record),
      desinstalacion: {
        id: record.desinstalacion.id,
        clienteId: record.desinstalacion.clienteId,
        servicioInternetId: record.desinstalacion.servicioInternetId,
        tipo: record.desinstalacion.tipo,
        motivo: record.desinstalacion.motivo,
        estado: record.desinstalacion.estado,
        fechaProgramada: record.desinstalacion.fechaProgramada,
        observaciones: record.desinstalacion.observaciones,
      },
    }));
  }

  async save(
    entity: ClienteDesinstalacionAutorizacionEntity,
  ): Promise<ClienteDesinstalacionAutorizacionEntity> {
    const props = entity.toPrimitives();

    if (!props.id) {
      throw new Error('No se puede guardar una autorización sin id.');
    }

    const record = await this.prisma.clienteDesinstalacionAutorizacion.update({
      where: {
        id: props.id,
      },
      data: ClienteDesinstalacionAutorizacionPrismaMapper.toUpdatePersistence(
        entity,
      ),
    });

    return ClienteDesinstalacionAutorizacionPrismaMapper.toDomain(record);
  }
}
