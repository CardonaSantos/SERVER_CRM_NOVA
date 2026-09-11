import { Injectable } from '@nestjs/common';

import {
  EstadoAccesoInternet as PrismaEstadoAccesoInternet,
  EstadoCuentaPppoe as PrismaEstadoCuentaPppoe,
  EstadoOperacionPppoe as PrismaEstadoOperacionPppoe,
  Prisma,
  TipoOperacionPppoe as PrismaTipoOperacionPppoe,
} from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import { EstadoCuentaPppoe } from '../../domain/enums/pppoe-cliente-cuenta.enum';

import {
  ClientePppoeCuentaFindManyFilters,
  ClientePppoeCuentaPaginatedResult,
  OrigenCuentaPppoe,
} from '../../domain/read-models/cliente-pppoe-cuenta-listado.read-model';

import { ClientePppoeCuentaDetalleReadModel } from '../../domain/read-models/cliente-pppoe-cuenta-detalle.read-model';

import {
  BuscarDetalleCuentaPppoeParams,
  ClientePppoeCuentaQueryPort,
} from '../../domain/ports/pppoe-cliente-cuenta-query.port';

@Injectable()
export class ClientePppoeCuentaPrismaQueryRepository
  implements ClientePppoeCuentaQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filters: ClientePppoeCuentaFindManyFilters,
  ): Promise<ClientePppoeCuentaPaginatedResult> {
    this.assertPositiveInteger(filters.empresaId, 'empresaId');

    this.assertPositiveInteger(filters.page, 'page');

    this.assertPositiveInteger(filters.limit, 'limit');

    const where = this.buildWhere(filters);

    const skip = (filters.page - 1) * filters.limit;

    const [total, records] = await Promise.all([
      this.prisma.clientePppoeCuenta.count({
        where,
      }),

      this.prisma.clientePppoeCuenta.findMany({
        where,

        select: {
          id: true,

          accesoInternetId: true,

          usuario: true,

          estado: true,

          generadoEn: true,

          adoptadoEn: true,

          secretCreadoEn: true,

          activadoEn: true,

          suspendidoEn: true,

          ultimaSincronizacionEn: true,

          ultimoError: true,

          accesoInternet: {
            select: {
              estado: true,

              cliente: {
                select: {
                  id: true,

                  nombre: true,

                  apellidos: true,

                  telefono: true,

                  dpi: true,
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

              /*
               * Solamente necesitamos saber si alguna
               * instalación vinculó este acceso.
               */
              instalaciones: {
                select: {
                  id: true,
                },

                take: 1,
              },
            },
          },

          perfilHomologacion: {
            select: {
              id: true,

              codigoPerfil: true,

              servicioInternet: {
                select: {
                  id: true,

                  nombre: true,

                  velocidad: true,

                  precio: true,
                },
              },

              mikrotikRouter: {
                select: {
                  id: true,

                  nombre: true,
                },
              },
            },
          },

          operaciones: {
            select: {
              id: true,

              tipo: true,

              estado: true,

              creadoEn: true,

              finalizadoEn: true,
            },

            orderBy: [
              {
                creadoEn: 'desc',
              },
              {
                id: 'desc',
              },
            ],

            take: 1,
          },
        },

        orderBy: [
          {
            generadoEn: 'desc',
          },
          {
            id: 'desc',
          },
        ],

        skip,

        take: filters.limit,
      }),
    ]);

    return {
      data: records.map((record) => {
        /*
         * El acceso debería contener servicioInternet.
         *
         * Como tolerancia para registros históricos,
         * usamos el servicio de la homologación como
         * respaldo.
         */
        const servicio =
          record.accesoInternet.servicioInternet ??
          record.perfilHomologacion.servicioInternet;

        const ultimaOperacion = record.operaciones[0] ?? null;

        return {
          cuentaPppoeId: record.id,

          accesoInternetId: record.accesoInternetId,

          usuario: record.usuario,

          estadoCuenta: this.estadoCuentaFromPrisma(record.estado),

          estadoAcceso: this.estadoAccesoFromPrisma(
            record.accesoInternet.estado,
          ),

          generadoEn: record.generadoEn,

          secretCreadoEn: record.secretCreadoEn,

          activadoEn: record.activadoEn,

          suspendidoEn: record.suspendidoEn,

          ultimaSincronizacionEn: record.ultimaSincronizacionEn,

          ultimoError: record.ultimoError,

          cliente: {
            id: record.accesoInternet.cliente.id,

            nombre: record.accesoInternet.cliente.nombre,

            apellidos: record.accesoInternet.cliente.apellidos,

            telefono: record.accesoInternet.cliente.telefono,

            dpi: record.accesoInternet.cliente.dpi,
          },

          servicioInternet: servicio
            ? {
                id: servicio.id,

                nombre: servicio.nombre,

                velocidad: servicio.velocidad,

                precio: servicio.precio,
              }
            : null,

          perfilHomologacion: {
            id: record.perfilHomologacion.id,

            codigoPerfil: record.perfilHomologacion.codigoPerfil,
          },

          router: {
            id: record.perfilHomologacion.mikrotikRouter.id,

            nombre: record.perfilHomologacion.mikrotikRouter.nombre,
          },

          origen: this.resolveOrigen(
            record.adoptadoEn,
            record.accesoInternet.instalaciones.length > 0,
          ),

          ultimaOperacion:
            ultimaOperacion === null
              ? null
              : {
                  id: ultimaOperacion.id,

                  tipo: this.tipoOperacionFromPrisma(ultimaOperacion.tipo),

                  estado: this.estadoOperacionFromPrisma(
                    ultimaOperacion.estado,
                  ),

                  creadoEn: ultimaOperacion.creadoEn,

                  finalizadoEn: ultimaOperacion.finalizadoEn,
                },
        };
      }),

      meta: {
        total,

        page: filters.page,

        limit: filters.limit,

        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findDetailById(
    params: BuscarDetalleCuentaPppoeParams,
  ): Promise<ClientePppoeCuentaDetalleReadModel | null> {
    this.assertPositiveInteger(params.empresaId, 'empresaId');

    this.assertPositiveInteger(params.cuentaPppoeId, 'cuentaPppoeId');

    const record = await this.prisma.clientePppoeCuenta.findFirst({
      where: {
        id: params.cuentaPppoeId,

        empresaId: params.empresaId,
      },

      select: {
        id: true,

        empresaId: true,

        accesoInternetId: true,

        perfilHomologacionId: true,

        usuario: true,

        estado: true,

        generadoPorId: true,

        adoptadoPorId: true,

        generadoEn: true,
        adoptadoEn: true,

        secretCreadoEn: true,

        activadoEn: true,

        suspendidoEn: true,

        eliminadoEn: true,

        ultimaSincronizacionEn: true,

        ultimoError: true,

        actualizadoEn: true,

        generadoPor: {
          select: {
            id: true,

            nombre: true,

            correo: true,

            telefono: true,

            activo: true,
          },
        },

        adoptadoPor: {
          select: {
            id: true,

            nombre: true,

            correo: true,

            telefono: true,

            activo: true,
          },
        },

        accesoInternet: {
          select: {
            id: true,

            tecnologia: true,

            metodoAutenticacion: true,

            estado: true,

            activadoEn: true,

            suspendidoEn: true,

            dadoDeBajaEn: true,

            creadoEn: true,

            actualizadoEn: true,

            cliente: {
              select: {
                id: true,

                nombre: true,

                apellidos: true,

                telefono: true,

                dpi: true,

                direccion: true,

                estadoCliente: true,

                estadoCobranza: true,
              },
            },

            servicioInternet: {
              select: {
                id: true,

                nombre: true,

                velocidad: true,

                precio: true,

                estado: true,
              },
            },

            instalaciones: {
              select: {
                id: true,

                accion: true,

                creadoEn: true,

                instalacion: {
                  select: {
                    id: true,

                    tipo: true,

                    estado: true,

                    fechaProgramada: true,

                    fechaInicio: true,

                    fechaFinalizacion: true,

                    creadoEn: true,
                  },
                },
              },

              orderBy: [
                {
                  creadoEn: 'desc',
                },
                {
                  id: 'desc',
                },
              ],
            },
          },
        },

        perfilHomologacion: {
          select: {
            id: true,

            mikrotikRouterId: true,

            servicioInternetId: true,

            codigoPerfil: true,

            activo: true,

            servicioInternet: {
              select: {
                id: true,

                nombre: true,

                velocidad: true,

                precio: true,

                estado: true,
              },
            },

            mikrotikRouter: {
              select: {
                id: true,

                nombre: true,

                host: true,

                sshPort: true,

                descripcion: true,

                activo: true,
              },
            },
          },
        },

        operaciones: {
          select: {
            id: true,

            tipo: true,

            estado: true,

            reintentoDeId: true,

            numeroIntento: true,

            motivo: true,

            errorCodigo: true,

            errorMensaje: true,

            iniciadoEn: true,

            finalizadoEn: true,

            creadoEn: true,

            iniciadoPor: {
              select: {
                id: true,

                nombre: true,

                correo: true,

                telefono: true,

                activo: true,
              },
            },
          },

          orderBy: [
            {
              creadoEn: 'desc',
            },
            {
              id: 'desc',
            },
          ],

          take: 1,
        },

        _count: {
          select: {
            operaciones: true,

            auditorias: true,
          },
        },
      },
    });

    if (!record) {
      return null;
    }

    const servicio =
      record.accesoInternet.servicioInternet ??
      record.perfilHomologacion.servicioInternet;

    const ultimaOperacion = record.operaciones[0] ?? null;

    return {
      cuentaPppoeId: record.id,

      empresaId: record.empresaId,

      accesoInternetId: record.accesoInternetId,

      perfilHomologacionId: record.perfilHomologacionId,

      usuario: record.usuario,

      estadoCuenta: this.estadoCuentaFromPrisma(record.estado),

      generadoPorId: record.generadoPorId,

      adoptadoPorId: record.adoptadoPorId,

      generadoEn: record.generadoEn,

      adoptadoEn: record.adoptadoEn,

      secretCreadoEn: record.secretCreadoEn,

      activadoEn: record.activadoEn,

      suspendidoEn: record.suspendidoEn,

      eliminadoEn: record.eliminadoEn,

      ultimaSincronizacionEn: record.ultimaSincronizacionEn,

      ultimoError: record.ultimoError,

      actualizadoEn: record.actualizadoEn,

      generadoPor: record.generadoPor
        ? {
            id: record.generadoPor.id,

            nombre: record.generadoPor.nombre,

            correo: record.generadoPor.correo,

            telefono: record.generadoPor.telefono,

            activo: record.generadoPor.activo,
          }
        : null,

      adoptadoPor: record.adoptadoPor
        ? {
            id: record.adoptadoPor.id,

            nombre: record.adoptadoPor.nombre,

            correo: record.adoptadoPor.correo,

            telefono: record.adoptadoPor.telefono,

            activo: record.adoptadoPor.activo,
          }
        : null,

      cliente: {
        id: record.accesoInternet.cliente.id,

        nombre: record.accesoInternet.cliente.nombre,

        apellidos: record.accesoInternet.cliente.apellidos,

        telefono: record.accesoInternet.cliente.telefono,

        dpi: record.accesoInternet.cliente.dpi,

        direccion: record.accesoInternet.cliente.direccion,

        estadoCliente: record.accesoInternet.cliente.estadoCliente,

        estadoCobranza: record.accesoInternet.cliente.estadoCobranza,
      },

      accesoInternet: {
        id: record.accesoInternet.id,

        tecnologia: record.accesoInternet.tecnologia,

        metodoAutenticacion: record.accesoInternet.metodoAutenticacion,

        estado: this.estadoAccesoFromPrisma(record.accesoInternet.estado),

        activadoEn: record.accesoInternet.activadoEn,

        suspendidoEn: record.accesoInternet.suspendidoEn,

        dadoDeBajaEn: record.accesoInternet.dadoDeBajaEn,

        creadoEn: record.accesoInternet.creadoEn,

        actualizadoEn: record.accesoInternet.actualizadoEn,
      },

      servicioInternet: servicio
        ? {
            id: servicio.id,

            nombre: servicio.nombre,

            velocidad: servicio.velocidad,

            precio: servicio.precio,

            estado: servicio.estado,
          }
        : null,

      perfilHomologacion: {
        id: record.perfilHomologacion.id,

        mikrotikRouterId: record.perfilHomologacion.mikrotikRouterId,

        servicioInternetId: record.perfilHomologacion.servicioInternetId,

        codigoPerfil: record.perfilHomologacion.codigoPerfil,

        activo: record.perfilHomologacion.activo,
      },

      router: {
        id: record.perfilHomologacion.mikrotikRouter.id,

        nombre: record.perfilHomologacion.mikrotikRouter.nombre,

        host: record.perfilHomologacion.mikrotikRouter.host,

        sshPort: record.perfilHomologacion.mikrotikRouter.sshPort,

        descripcion: record.perfilHomologacion.mikrotikRouter.descripcion,

        activo: record.perfilHomologacion.mikrotikRouter.activo,
      },

      origen: this.resolveOrigen(
        record.adoptadoEn,
        record.accesoInternet.instalaciones.length > 0,
      ),

      instalaciones: record.accesoInternet.instalaciones.map((vinculo) => ({
        vinculoId: vinculo.id,

        accion: vinculo.accion,

        vinculadoEn: vinculo.creadoEn,

        instalacion: {
          id: vinculo.instalacion.id,

          tipo: vinculo.instalacion.tipo,

          estado: vinculo.instalacion.estado,

          fechaProgramada: vinculo.instalacion.fechaProgramada,

          fechaInicio: vinculo.instalacion.fechaInicio,

          fechaFinalizacion: vinculo.instalacion.fechaFinalizacion,

          creadoEn: vinculo.instalacion.creadoEn,
        },
      })),

      ultimaOperacion: ultimaOperacion
        ? {
            id: ultimaOperacion.id,

            tipo: this.tipoOperacionFromPrisma(ultimaOperacion.tipo),

            estado: this.estadoOperacionFromPrisma(ultimaOperacion.estado),

            reintentoDeId: ultimaOperacion.reintentoDeId,

            numeroIntento: ultimaOperacion.numeroIntento,

            motivo: ultimaOperacion.motivo,

            errorCodigo: ultimaOperacion.errorCodigo,

            errorMensaje: ultimaOperacion.errorMensaje,

            iniciadoEn: ultimaOperacion.iniciadoEn,

            finalizadoEn: ultimaOperacion.finalizadoEn,

            creadoEn: ultimaOperacion.creadoEn,

            iniciadoPor: ultimaOperacion.iniciadoPor
              ? {
                  id: ultimaOperacion.iniciadoPor.id,

                  nombre: ultimaOperacion.iniciadoPor.nombre,

                  correo: ultimaOperacion.iniciadoPor.correo,

                  telefono: ultimaOperacion.iniciadoPor.telefono,

                  activo: ultimaOperacion.iniciadoPor.activo,
                }
              : null,
          }
        : null,

      conteos: {
        instalaciones: record.accesoInternet.instalaciones.length,

        operaciones: record._count.operaciones,

        auditorias: record._count.auditorias,
      },
    };
  }

  private buildWhere(
    filters: ClientePppoeCuentaFindManyFilters,
  ): Prisma.ClientePppoeCuentaWhereInput {
    const searchTokens = this.normalizeSearchTokens(filters.search);

    return {
      empresaId: filters.empresaId,

      adoptadoEn:
        filters.origen === OrigenCuentaPppoe.EXTERNA_ADOPTADA
          ? {
              not: null,
            }
          : filters.origen === OrigenCuentaPppoe.INSTALACION ||
              filters.origen === OrigenCuentaPppoe.ALTA_MANUAL
            ? null
            : undefined,

      perfilHomologacionId: filters.perfilHomologacionId ?? undefined,

      estado: filters.estadoCuenta
        ? this.estadoCuentaToPrisma(filters.estadoCuenta)
        : undefined,

      perfilHomologacion: {
        is: {
          servicioInternetId: filters.servicioInternetId ?? undefined,

          mikrotikRouterId: filters.mikrotikRouterId ?? undefined,
        },
      },

      accesoInternet: {
        is: {
          clienteId: filters.clienteId ?? undefined,

          estado: filters.estadoAcceso
            ? this.estadoAccesoToPrisma(filters.estadoAcceso)
            : undefined,

          instalaciones:
            filters.origen === OrigenCuentaPppoe.INSTALACION
              ? {
                  some: {},
                }
              : filters.origen === OrigenCuentaPppoe.ALTA_MANUAL
                ? {
                    none: {},
                  }
                : undefined,
        },
      },

      AND:
        searchTokens.length === 0
          ? undefined
          : searchTokens.map((token) => this.buildSearchTokenWhere(token)),
    };
  }

  private buildSearchTokenWhere(
    token: string,
  ): Prisma.ClientePppoeCuentaWhereInput {
    const contains: Prisma.StringFilter = {
      contains: token,

      mode: Prisma.QueryMode.insensitive,
    };

    const numericId = /^\d+$/.test(token) ? Number(token) : null;

    const or: Prisma.ClientePppoeCuentaWhereInput[] = [
      {
        usuario: contains,
      },

      {
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

      {
        perfilHomologacion: {
          is: {
            codigoPerfil: contains,
          },
        },
      },

      {
        perfilHomologacion: {
          is: {
            mikrotikRouter: {
              is: {
                nombre: contains,
              },
            },
          },
        },
      },

      {
        perfilHomologacion: {
          is: {
            servicioInternet: {
              is: {
                OR: [
                  {
                    nombre: contains,
                  },
                  {
                    velocidad: contains,
                  },
                ],
              },
            },
          },
        },
      },
    ];

    /*
     * Si el token es numérico también permitimos
     * buscar por IDs administrativos.
     */
    if (
      numericId !== null &&
      Number.isSafeInteger(numericId) &&
      numericId > 0
    ) {
      or.push(
        {
          id: numericId,
        },

        {
          accesoInternetId: numericId,
        },

        {
          accesoInternet: {
            is: {
              clienteId: numericId,
            },
          },
        },
      );
    }

    return {
      OR: or,
    };
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
      .slice(0, 10);
  }

  private estadoCuentaToPrisma(
    value: EstadoCuentaPppoe,
  ): PrismaEstadoCuentaPppoe {
    return this.mapEnum(value, PrismaEstadoCuentaPppoe, 'EstadoCuentaPppoe');
  }

  private estadoCuentaFromPrisma(
    value: PrismaEstadoCuentaPppoe,
  ): EstadoCuentaPppoe {
    return this.mapEnum(value, EstadoCuentaPppoe, 'EstadoCuentaPppoe');
  }

  private estadoAccesoToPrisma(
    value: EstadoAccesoInternet,
  ): PrismaEstadoAccesoInternet {
    return this.mapEnum(
      value,
      PrismaEstadoAccesoInternet,
      'EstadoAccesoInternet',
    );
  }

  private estadoAccesoFromPrisma(
    value: PrismaEstadoAccesoInternet,
  ): EstadoAccesoInternet {
    return this.mapEnum(value, EstadoAccesoInternet, 'EstadoAccesoInternet');
  }

  private tipoOperacionFromPrisma(
    value: PrismaTipoOperacionPppoe,
  ): TipoOperacionPppoe {
    return this.mapEnum(value, TipoOperacionPppoe, 'TipoOperacionPppoe');
  }

  private estadoOperacionFromPrisma(
    value: PrismaEstadoOperacionPppoe,
  ): EstadoOperacionPppoe {
    return this.mapEnum(value, EstadoOperacionPppoe, 'EstadoOperacionPppoe');
  }

  private mapEnum<T extends string>(
    value: string,
    enumObject: Record<string, T>,
    enumName: string,
  ): T {
    const found = Object.values(enumObject).find(
      (candidate) => candidate === value,
    );

    if (!found) {
      throw new Error(`El valor "${value}" no pertenece a ${enumName}.`);
    }

    return found;
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }

  private resolveOrigen(
    adoptadoEn: Date | null,
    tieneInstalacion: boolean,
  ): OrigenCuentaPppoe {
    if (adoptadoEn !== null) {
      return OrigenCuentaPppoe.EXTERNA_ADOPTADA;
    }

    if (tieneInstalacion) {
      return OrigenCuentaPppoe.INSTALACION;
    }

    return OrigenCuentaPppoe.ALTA_MANUAL;
  }
}
