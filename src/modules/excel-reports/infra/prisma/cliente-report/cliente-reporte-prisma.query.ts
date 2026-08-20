import { Injectable } from '@nestjs/common';

import {
  EstadoCliente as PrismaEstadoCliente,
  EstadoDesinstalacionCliente,
  EstadoInstalacionCliente,
  Prisma,
} from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import { ClienteReporteQueryPort } from '../../../domain/ports/cliente-reportes/cliente-reporte-query.port';
import { ClienteReporteFilters } from '../../../domain/filters/cliente-reporte/clientes-query-filters';
import { ClienteReporteRow } from '../../../domain/read-models/cliente-reportes/cliente-reporte-row';
import { ClienteReporteResumen } from '../../../domain/read-models/cliente-reportes/cliente-reporte-resumen';
import { ClienteReportePeriodoResumen } from '../../../domain/read-models/cliente-reportes/cliente-reporte-periodo';
import { ClienteReporteEvolucionMes } from '../../../domain/read-models/cliente-reportes/cliente-reporte-evolucion-mes';

import { selectClienteInternetReport } from './cliente-reporte-selects.query';
import { ClienteReportePrismaMapper } from './cliente-reporte-prisma.mapper';

const ESTADOS_CARTERA_ACTUAL: PrismaEstadoCliente[] = [
  PrismaEstadoCliente.ACTIVO,
  PrismaEstadoCliente.SUSPENDIDO,
  PrismaEstadoCliente.PENDIENTE_ACTIVO,
  PrismaEstadoCliente.EN_INSTALACION,
];

@Injectable()
export class ClienteReportePrismaQuery implements ClienteReporteQueryPort {
  private static readonly GT_OFFSET_MS = 6 * 60 * 60 * 1000;

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

    return clientes.map((cliente) => ClienteReportePrismaMapper.toRow(cliente));
  }

  async getResumen(
    filters: ClienteReporteFilters,
  ): Promise<ClienteReporteResumen> {
    const clienteWhere = this.buildClienteResumenGlobalWhere(filters);

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

  private buildClienteResumenGlobalWhere(
    filters: ClienteReporteFilters,
  ): Prisma.ClienteInternetWhereInput {
    const where: Prisma.ClienteInternetWhereInput = {};

    if (!filters.incluirEliminados) {
      where.isEliminado = false;
    }

    return where;
  }

  /**
   * CONSTRUCTOR DE OPERACIONES
   * @param filters
   * @returns
   */
  private buildClienteOperacionWhere(
    filters: ClienteReporteFilters,
  ): Prisma.ClienteInternetWhereInput {
    const where: Prisma.ClienteInternetWhereInput = {};

    /**
     * Solamente dimensiones relativamente
     * estables.
     *
     * NO :
     * - estadoCliente
     * - estadoCobranza
     * - fechas de creación del cliente
     * - isEliminado
     *
     */

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

  /**
   * CONSTRUCTOR DE RESUMEN PERIODOS
   * @param filters
   * @param desde
   * @param hastaExclusivo
   * @param etiqueta
   * @returns
   */
  async getResumenPeriodo(
    filters: ClienteReporteFilters,
    desde: Date,
    hastaExclusivo: Date,
    etiqueta: string,
  ): Promise<ClienteReportePeriodoResumen> {
    const clienteWhere = this.buildClienteOperacionWhere(filters);

    const [instalacionesPorEstado, desinstalacionesPorEstado, altas, bajas] =
      await Promise.all([
        this.prisma.clienteInstalacion.groupBy({
          by: ['estado'],

          where: {
            creadoEn: {
              gte: desde,
              lt: hastaExclusivo,
            },

            cliente: {
              is: clienteWhere,
            },
          },

          _count: {
            _all: true,
          },
        }),

        this.prisma.clienteDesinstalacion.groupBy({
          by: ['estado'],

          where: {
            creadoEn: {
              gte: desde,
              lt: hastaExclusivo,
            },

            cliente: {
              is: clienteWhere,
            },
          },

          _count: {
            _all: true,
          },
        }),

        /**
         * ALTA:
         * instalación COMPLETADA cuya activación
         * ocurrió dentro del período.
         *
         * Para registros legacy sin
         * fechaActivacionServicio usamos
         * fechaFinalizacion como fallback.
         */
        this.prisma.clienteInstalacion.count({
          where: {
            estado: EstadoInstalacionCliente.COMPLETADA,

            cliente: {
              is: clienteWhere,
            },

            OR: [
              {
                fechaActivacionServicio: {
                  gte: desde,
                  lt: hastaExclusivo,
                },
              },
              {
                fechaActivacionServicio: null,

                fechaFinalizacion: {
                  gte: desde,
                  lt: hastaExclusivo,
                },
              },
            ],
          },
        }),

        /**
         * BAJA:
         * desinstalación completada dentro
         * del período.
         */
        this.prisma.clienteDesinstalacion.count({
          where: {
            estado: EstadoDesinstalacionCliente.COMPLETADA,

            fechaFinalizacion: {
              gte: desde,
              lt: hastaExclusivo,
            },

            cliente: {
              is: clienteWhere,
            },
          },
        }),
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
      etiqueta,

      desde,
      hastaExclusivo,

      altas,

      bajas,

      crecimientoNeto: altas - bajas,

      instalaciones: {
        registradas: this.sumTotals(instalaciones),

        porEstadoActual: instalaciones,
      },

      desinstalaciones: {
        registradas: this.sumTotals(desinstalaciones),

        porEstadoActual: desinstalaciones,
      },
    };
  }

  private monthKey(date: Date): string {
    const gtDate = new Date(
      date.getTime() - ClienteReportePrismaQuery.GT_OFFSET_MS,
    );

    const year = gtDate.getUTCFullYear();

    const month = gtDate.getUTCMonth() + 1;

    return `${year}-${String(month).padStart(2, '0')}`;
  }

  /**
   *
   *
   * @param desde
   * @param hastaExclusivo
   * @returns
   */
  private createMonthBuckets(
    desde: Date,
    hastaExclusivo: Date,
  ): Map<string, ClienteReporteEvolucionMes> {
    const result = new Map<string, ClienteReporteEvolucionMes>();

    const desdeGt = new Date(
      desde.getTime() - ClienteReportePrismaQuery.GT_OFFSET_MS,
    );

    const hastaGt = new Date(
      hastaExclusivo.getTime() - ClienteReportePrismaQuery.GT_OFFSET_MS,
    );

    const cursor = new Date(
      Date.UTC(desdeGt.getUTCFullYear(), desdeGt.getUTCMonth(), 1),
    );

    const limit = new Date(
      Date.UTC(hastaGt.getUTCFullYear(), hastaGt.getUTCMonth(), 1),
    );

    while (cursor < limit) {
      const anio = cursor.getUTCFullYear();

      const mes = cursor.getUTCMonth() + 1;

      const key = `${anio}-${String(mes).padStart(2, '0')}`;

      const etiqueta = new Intl.DateTimeFormat('es-GT', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(cursor);

      result.set(key, {
        anio,
        mes,

        etiqueta: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1),

        altas: 0,
        bajas: 0,
        crecimientoNeto: 0,
      });

      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return result;
  }

  async getEvolucionMensual(
    filters: ClienteReporteFilters,
    desde: Date,
    hastaExclusivo: Date,
  ): Promise<ClienteReporteEvolucionMes[]> {
    const clienteWhere = this.buildClienteOperacionWhere(filters);

    const [instalaciones, desinstalaciones] = await Promise.all([
      this.prisma.clienteInstalacion.findMany({
        where: {
          estado: EstadoInstalacionCliente.COMPLETADA,

          cliente: {
            is: clienteWhere,
          },

          OR: [
            {
              fechaActivacionServicio: {
                gte: desde,
                lt: hastaExclusivo,
              },
            },

            {
              fechaActivacionServicio: null,

              fechaFinalizacion: {
                gte: desde,
                lt: hastaExclusivo,
              },
            },
          ],
        },

        select: {
          fechaActivacionServicio: true,
          fechaFinalizacion: true,
        },
      }),

      this.prisma.clienteDesinstalacion.findMany({
        where: {
          estado: EstadoDesinstalacionCliente.COMPLETADA,

          fechaFinalizacion: {
            gte: desde,
            lt: hastaExclusivo,
          },

          cliente: {
            is: clienteWhere,
          },
        },

        select: {
          fechaFinalizacion: true,
        },
      }),
    ]);

    const meses = this.createMonthBuckets(desde, hastaExclusivo);

    for (const instalacion of instalaciones) {
      const fecha =
        instalacion.fechaActivacionServicio ?? instalacion.fechaFinalizacion;

      if (!fecha) {
        continue;
      }

      const key = this.monthKey(fecha);

      const mes = meses.get(key);

      if (mes) {
        mes.altas += 1;
      }
    }

    for (const desinstalacion of desinstalaciones) {
      const fecha = desinstalacion.fechaFinalizacion;

      if (!fecha) {
        continue;
      }

      const key = this.monthKey(fecha);

      const mes = meses.get(key);

      if (mes) {
        mes.bajas += 1;
      }
    }

    return Array.from(meses.values()).map((mes) => ({
      ...mes,

      crecimientoNeto: mes.altas - mes.bajas,
    }));
  }
}
