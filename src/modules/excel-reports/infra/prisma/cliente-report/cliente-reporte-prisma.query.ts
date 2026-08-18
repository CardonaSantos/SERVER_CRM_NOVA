import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteReporteQueryPort } from '../../../domain/ports/cliente-reportes/cliente-reporte-query.port';
import { ClienteReporteFilters } from '../../../domain/filters/clientes-query-filters';
import { ClienteReporteRow } from '../../../domain/read-models/cliente-reportes/cliente-reporte-row';
import {
  ClienteReportePrismaResult,
  selectClienteInternetReport,
} from './cliente-reporte-selects.query';
import { ClienteReportePrismaMapper } from './cliente-reporte-prisma.mapper';
import { ClienteReporteResumen } from 'src/modules/excel-reports/domain/read-models/cliente-reportes/cliente-reporte-resumen';
import { EstadoCliente as PrismaEstadoCliente } from '@prisma/client';
const ESTADOS_CARTERA_ACTUAL: PrismaEstadoCliente[] = [
  PrismaEstadoCliente.ACTIVO,
  PrismaEstadoCliente.SUSPENDIDO,
  PrismaEstadoCliente.PENDIENTE_ACTIVO,
  PrismaEstadoCliente.EN_INSTALACION,
];

@Injectable()
export class ClienteReportePrismaQuery implements ClienteReporteQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findRows(filters: ClienteReporteFilters): Promise<ClienteReporteRow[]> {
    const where = this.buildClienteWhere(filters);

    const clientes = await this.prisma.clienteInternet.findMany({
      where,

      select: selectClienteInternetReport,

      orderBy: [
        {
          nombre: 'asc',
        },
        {
          apellidos: 'asc',
        },
      ],
    });

    return clientes.map(ClienteReportePrismaMapper.toRow);
  }

  async getResumen(
    filters: ClienteReporteFilters,
  ): Promise<ClienteReporteResumen> {
    const clienteWhere = this.buildClienteWhere(filters);

    const [
      totalClientes,

      carteraActual,

      clientesPorEstado,

      clientesPorCobranza,

      instalacionesPorEstado,

      desinstalacionesPorEstado,
    ] = await Promise.all([
      this.countClientes(clienteWhere),

      this.countCarteraActual(clienteWhere),

      this.groupClientesByEstado(clienteWhere),

      this.groupClientesByCobranza(clienteWhere),

      this.groupInstalacionesByEstado(filters, clienteWhere),

      this.groupDesinstalacionesByEstado(filters, clienteWhere),
    ]);

    const instalaciones = instalacionesPorEstado.map((item) => ({
      categoria: item.estado,
      total: item._count._all,
    }));

    const desinstalaciones = desinstalacionesPorEstado.map((item) => ({
      categoria: item.estado,
      total: item._count._all,
    }));

    return {
      totalClientes,

      carteraActual,

      porEstadoCliente: clientesPorEstado.map((item) => ({
        categoria: item.estadoCliente,
        total: item._count._all,
      })),

      porEstadoCobranza: clientesPorCobranza.map((item) => ({
        categoria: item.estadoCobranza,
        total: item._count._all,
      })),

      instalaciones: {
        total: this.sumTotals(instalaciones),
        porEstado: instalaciones,
      },

      desinstalaciones: {
        total: this.sumTotals(desinstalaciones),
        porEstado: desinstalaciones,
      },
    };
  }

  private countClientes(where: Prisma.ClienteInternetWhereInput) {
    return this.prisma.clienteInternet.count({
      where,
    });
  }

  private countCarteraActual(where: Prisma.ClienteInternetWhereInput) {
    return this.prisma.clienteInternet.count({
      where: {
        AND: [
          where,

          {
            isEliminado: false,

            estadoCliente: {
              in: ESTADOS_CARTERA_ACTUAL,
            },
          },
        ],
      },
    });
  }

  private groupClientesByEstado(where: Prisma.ClienteInternetWhereInput) {
    return this.prisma.clienteInternet.groupBy({
      by: ['estadoCliente'],

      where,

      _count: {
        _all: true,
      },
    });
  }

  private groupClientesByCobranza(where: Prisma.ClienteInternetWhereInput) {
    return this.prisma.clienteInternet.groupBy({
      by: ['estadoCobranza'],

      where,

      _count: {
        _all: true,
      },
    });
  }

  private groupInstalacionesByEstado(
    filters: ClienteReporteFilters,
    clienteWhere: Prisma.ClienteInternetWhereInput,
  ) {
    return this.prisma.clienteInstalacion.groupBy({
      by: ['estado'],

      where: {
        cliente: {
          is: clienteWhere,
        },
      },

      _count: {
        _all: true,
      },
    });
  }

  private groupDesinstalacionesByEstado(
    filters: ClienteReporteFilters,
    clienteWhere: Prisma.ClienteInternetWhereInput,
  ) {
    return this.prisma.clienteDesinstalacion.groupBy({
      by: ['estado'],

      where: {
        cliente: {
          is: clienteWhere,
        },
      },

      _count: {
        _all: true,
      },
    });
  }

  private sumTotals(
    items: Array<{
      total: number;
    }>,
  ): number {
    return items.reduce((accumulator, item) => accumulator + item.total, 0);
  }

  private buildClienteWhere(
    filters: ClienteReporteFilters,
  ): Prisma.ClienteInternetWhereInput {
    const where: Prisma.ClienteInternetWhereInput = {};

    /**
     * Por defecto un reporte administrativo
     * no incluye registros eliminados.
     */
    if (!filters.incluirEliminados) {
      where.isEliminado = false;
    }

    if (filters.estado) {
      where.estadoCliente = filters.estado;
    }

    if (filters.estadoCobranza) {
      where.estadoCobranza = filters.estadoCobranza;
    }

    if (filters.servicioInternetId) {
      where.servicioInternetId = filters.servicioInternetId;
    }

    if (filters.sectorId) {
      where.sectorId = filters.sectorId;
    }

    if (filters.municipioId) {
      where.municipioId = filters.municipioId;
    }

    if (filters.departamentoId) {
      where.departamentoId = filters.departamentoId;
    }

    if (filters.fechaCreadoDesde || filters.fechaCreadoHasta) {
      where.creadoEn = {
        ...(filters.fechaCreadoDesde
          ? {
              gte: filters.fechaCreadoDesde,
            }
          : {}),

        ...(filters.fechaCreadoHasta
          ? {
              lte: filters.fechaCreadoHasta,
            }
          : {}),
      };
    }

    const search = filters.search?.trim();

    if (search) {
      where.OR = [
        {
          nombre: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          apellidos: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          searchNombre: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          telefono: {
            contains: search,
          },
        },

        {
          dpi: {
            contains: search,
          },
        },
      ];
    }

    return where;
  }
}
