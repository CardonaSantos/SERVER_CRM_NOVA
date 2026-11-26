import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  aDesplazamiento,
  Paginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { PrismaService } from 'src/prisma/prisma.service';
import { AutorizacionDesinstalacionQueryPort } from '../../domain/ports/autorizacion-desinstalacion-query.port';
import { AutorizacionDesinstalacionPendiente } from '../../domain/read-models/autorizacion-desinstalacion-pendiente.read-model';
import { resumirAutorizacion } from '../../domain/read-models/cliente-desinstalacion-resumen.read-model';
import { ClienteDesinstalacionAutorizacionPrismaMapper } from './cliente-desinstalacion-autorizacion-prisma.mapper';

@Injectable()
export class AutorizacionDesinstalacionPrismaQuery
  implements AutorizacionDesinstalacionQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findPendientes(
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<AutorizacionDesinstalacionPendiente>> {
    const where: Prisma.ClienteDesinstalacionAutorizacionWhereInput = {};

    const [total, records] = await this.prisma.$transaction([
      this.prisma.clienteDesinstalacionAutorizacion.count({
        where,
      }),

      this.prisma.clienteDesinstalacionAutorizacion.findMany({
        where,

        ...aDesplazamiento(paginacion),

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
      items: records.map((record) => ({
        autorizacion: resumirAutorizacion(
          ClienteDesinstalacionAutorizacionPrismaMapper.toDomain(record),
        ),

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

      total,
      page: paginacion.page,
      limit: paginacion.limit,
    };
  }
}
