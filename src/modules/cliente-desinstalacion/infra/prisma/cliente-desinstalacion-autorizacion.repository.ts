import { Injectable } from '@nestjs/common';
import {
  Prisma,
  EstadoAutorizacionDesinstalacion as PrismaEstadoAutorizacion,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AutorizacionDesinstalacionPendiente,
  AutorizacionesPendientesPaginatedResult,
  BuscarAutorizacionesPendientesParams,
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

  async findPendientes(
    params: BuscarAutorizacionesPendientesParams,
  ): Promise<AutorizacionesPendientesPaginatedResult> {
    const page = Math.max(params.page, 1);

    const limit = Math.min(Math.max(params.limit, 1), 100);

    const skip = (page - 1) * limit;

    const where: Prisma.ClienteDesinstalacionAutorizacionWhereInput = {};

    const [total, records] = await this.prisma.$transaction([
      this.prisma.clienteDesinstalacionAutorizacion.count({
        where,
      }),

      this.prisma.clienteDesinstalacionAutorizacion.findMany({
        where,

        skip,

        take: limit,

        include: {
          solicitadoPor: {
            select: {
              id: true,

              nombre: true,
            },
          },

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

              cliente: {
                select: {
                  id: true,

                  nombre: true,

                  apellidos: true,

                  telefono: true,

                  direccion: true,
                },
              },

              servicioInternet: {
                select: {
                  id: true,

                  nombre: true,

                  velocidad: true,

                  precio: true,
                },
              },
            },
          },
        },

        orderBy: [
          {
            fechaSolicitud: 'desc',
          },

          {
            id: 'asc',
          },
        ],
      }),
    ]);

    return {
      data: records.map((record) => ({
        autorizacion:
          ClienteDesinstalacionAutorizacionPrismaMapper.toDomain(record),

        solicitadoPor: record.solicitadoPor
          ? {
              id: record.solicitadoPor.id,

              nombre: record.solicitadoPor.nombre,
            }
          : null,

        desinstalacion: {
          id: record.desinstalacion.id,

          clienteId: record.desinstalacion.clienteId,

          servicioInternetId: record.desinstalacion.servicioInternetId,

          tipo: record.desinstalacion.tipo,

          motivo: record.desinstalacion.motivo,

          estado: record.desinstalacion.estado,

          fechaProgramada: record.desinstalacion.fechaProgramada,

          observaciones: record.desinstalacion.observaciones,

          cliente: {
            id: record.desinstalacion.cliente.id,

            nombre: record.desinstalacion.cliente.nombre,

            apellidos: record.desinstalacion.cliente.apellidos,

            telefono: record.desinstalacion.cliente.telefono,

            direccion: record.desinstalacion.cliente.direccion,
          },

          servicioInternet: record.desinstalacion.servicioInternet
            ? {
                id: record.desinstalacion.servicioInternet.id,

                nombre: record.desinstalacion.servicioInternet.nombre,

                velocidad: record.desinstalacion.servicioInternet.velocidad,

                precio: record.desinstalacion.servicioInternet.precio,
              }
            : null,
        },
      })),

      meta: {
        total,

        page,

        limit,

        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
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

  async findUltimaByDesinstalacionId(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionAutorizacionEntity | null> {
    const record =
      await this.prisma.clienteDesinstalacionAutorizacion.findFirst({
        where: {
          desinstalacionId,
        },

        orderBy: [
          {
            fechaSolicitud: 'desc',
          },
          {
            id: 'desc',
          },
        ],
      });

    return record
      ? ClienteDesinstalacionAutorizacionPrismaMapper.toDomain(record)
      : null;
  }
}
