import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  BuscarPppoeOperacionDetalleParams,
  PppoeOperacionQueryPort,
} from '../../domain/ports/pppoe-operacion-query.port';
import {
  PppoeOperacionFindManyFilters,
  PppoeOperacionPaginatedResult,
} from '../../domain/read-models/pppoe-operacion.read-model';

import { PppoeOperacionPrismaEnumMapper } from './pppoe-operacion-enum-prisma.mapper';
import {
  PPPOE_OPERACION_DETAIL_INCLUDE,
  PPPOE_OPERACION_LIST_INCLUDE,
  PppoeOperacionReadModelPrismaMapper,
} from './pppoe-operacion-read-model-prisma.mapper';

/** Listado y detalle de operaciones PPPoE para pantallas (read models). */
@Injectable()
export class PppoeOperacionPrismaQuery implements PppoeOperacionQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * LISTADO PAGINADO
   * Devuelve operaciones paginadas con relaciones
   * resumidas para la UI.
   */
  async findPaginated(
    filters: PppoeOperacionFindManyFilters,
  ): Promise<PppoeOperacionPaginatedResult> {
    this.assertPositiveInteger(filters.page, 'page');
    this.assertPositiveInteger(filters.limit, 'limit');

    const where = this.buildFindManyWhere(filters);

    const orderBy = this.buildFindManyOrderBy(filters);

    const skip = (filters.page - 1) * filters.limit;

    const [total, records] = await this.prisma.$transaction([
      this.prisma.pppoeOperacion.count({
        where,
      }),
      this.prisma.pppoeOperacion.findMany({
        where,
        include: PPPOE_OPERACION_LIST_INCLUDE,
        orderBy,
        skip,
        take: filters.limit,
      }),
    ]);

    return {
      data: records.map((record) =>
        PppoeOperacionReadModelPrismaMapper.toListItem(record),
      ),
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  /**
   * DETALLE ENRIQUECIDO
   * Devuelve el detalle completo de una operación.
   */
  async findDetailById(params: BuscarPppoeOperacionDetalleParams) {
    this.assertPositiveInteger(params.operacionId, 'operacionId');

    const found = await this.prisma.pppoeOperacion.findFirst({
      where: {
        id: params.operacionId,
      },
      include: PPPOE_OPERACION_DETAIL_INCLUDE,
    });

    return found ? PppoeOperacionReadModelPrismaMapper.toDetail(found) : null;
  }

  private buildFindManyWhere(
    filters: PppoeOperacionFindManyFilters,
  ): Prisma.PppoeOperacionWhereInput {
    const searchTokens = this.normalizeSearchTokens(filters.search);

    const fechaFilter =
      filters.fechaDesde || filters.fechaHasta
        ? {
            gte: filters.fechaDesde ?? undefined,
            lte: filters.fechaHasta ?? undefined,
          }
        : undefined;

    return {
      cuentaPppoeId: filters.cuentaPppoeId ?? undefined,
      mikrotikRouterId: filters.mikrotikRouterId ?? undefined,
      perfilHomologacionId: filters.perfilHomologacionId ?? undefined,
      instalacionId: filters.instalacionId ?? undefined,
      desinstalacionId: filters.desinstalacionId ?? undefined,
      iniciadoPorId: filters.iniciadoPorId ?? undefined,
      reautenticadoPorId: filters.reautenticadoPorId ?? undefined,
      reintentoDeId: filters.reintentoDeId ?? undefined,
      tipo:
        filters.tipos && filters.tipos.length > 0
          ? {
              in: filters.tipos.map((tipo) =>
                PppoeOperacionPrismaEnumMapper.tipoOperacionToPrisma(tipo),
              ),
            }
          : undefined,
      origen:
        filters.origenes && filters.origenes.length > 0
          ? {
              in: filters.origenes.map((origen) =>
                PppoeOperacionPrismaEnumMapper.origenOperacionToPrisma(origen),
              ),
            }
          : undefined,
      canal:
        filters.canales && filters.canales.length > 0
          ? {
              in: filters.canales.map((canal) =>
                PppoeOperacionPrismaEnumMapper.canalOperacionToPrisma(canal),
              ),
            }
          : undefined,
      estado:
        filters.estados && filters.estados.length > 0
          ? {
              in: filters.estados.map((estado) =>
                PppoeOperacionPrismaEnumMapper.estadoOperacionToPrisma(estado),
              ),
            }
          : undefined,
      requiereReautenticacion: filters.requiereReautenticacion ?? undefined,
      numeroIntento: filters.numeroIntento ?? undefined,
      /**
       * El rango de fechas se aplica sobre creadoEn.
       */
      creadoEn: fechaFilter,
      /**
       * Cada token debe coincidir con al menos uno
       * de los campos buscables.
       */
      AND:
        searchTokens.length === 0
          ? undefined
          : searchTokens.map((token) => this.buildSearchTokenWhere(token)),
    };
  }

  private buildSearchTokenWhere(
    token: string,
  ): Prisma.PppoeOperacionWhereInput {
    const contains: Prisma.StringFilter = {
      contains: token,
      mode: Prisma.QueryMode.insensitive,
    };

    return {
      OR: [
        {
          claveIdempotencia: contains,
        },
        {
          usuarioPppoeSnapshot: contains,
        },
        {
          codigoPerfilSnapshot: contains,
        },
        {
          routerHostSnapshot: contains,
        },
        {
          motivo: contains,
        },
        {
          errorCodigo: contains,
        },
        {
          errorMensaje: contains,
        },
        {
          cuentaPppoe: {
            is: {
              usuario: contains,
            },
          },
        },
        {
          mikrotikRouter: {
            is: {
              OR: [
                {
                  nombre: contains,
                },
                {
                  host: contains,
                },
              ],
            },
          },
        },
        {
          iniciadoPor: {
            is: {
              OR: [
                {
                  nombre: contains,
                },
                {
                  correo: contains,
                },
                {
                  telefono: contains,
                },
              ],
            },
          },
        },
        {
          reautenticadoPor: {
            is: {
              OR: [
                {
                  nombre: contains,
                },
                {
                  correo: contains,
                },
                {
                  telefono: contains,
                },
              ],
            },
          },
        },
        {
          cuentaPppoe: {
            is: {
              accesoInternet: {
                is: {
                  cliente: {
                    is: {
                      OR: [
                        {
                          nombre: contains,
                        },
                        {
                          apellidos: contains,
                        },
                        {
                          telefono: contains,
                        },
                        {
                          dpi: contains,
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      ],
    };
  }

  private buildFindManyOrderBy(
    filters: PppoeOperacionFindManyFilters,
  ): Prisma.PppoeOperacionOrderByWithRelationInput[] {
    const direction = filters.ordenDireccion ?? 'desc';

    switch (filters.ordenPor) {
      case 'iniciadoEn':
        return [
          {
            iniciadoEn: direction,
          },
          {
            id: 'desc',
          },
        ];

      case 'finalizadoEn':
        return [
          {
            finalizadoEn: direction,
          },
          {
            id: 'desc',
          },
        ];

      case 'numeroIntento':
        return [
          {
            numeroIntento: direction,
          },
          {
            creadoEn: 'desc',
          },
          {
            id: 'desc',
          },
        ];

      case 'creadoEn':
      default:
        return [
          {
            creadoEn: direction,
          },
          {
            id: 'desc',
          },
        ];
    }
  }

  private normalizeSearchTokens(search?: string | null): string[] {
    if (!search) {
      return [];
    }

    return search
      .trim()
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }
}
