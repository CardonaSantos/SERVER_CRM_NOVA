import { BadRequestException, Injectable } from '@nestjs/common';

import {
  AccionAuditoriaPppoe as PrismaAccionAuditoriaPppoe,
  AccionInstalacionAcceso as PrismaAccionInstalacionAcceso,
  EstadoOperacionPppoe as PrismaEstadoOperacionPppoe,
  MetodoAutenticacionInternet as PrismaMetodoAutenticacionInternet,
  OrigenOperacionPppoe as PrismaOrigenOperacionPppoe,
  Prisma,
  TecnologiaAccesoInternet as PrismaTecnologiaAccesoInternet,
  TipoOperacionPppoe as PrismaTipoOperacionPppoe,
} from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import { PppoeAuditoriaInstalacionQueryPort } from '../../domain/ports/pppoe-auditoria-instalacion-query.port';

import {
  PppoeAuditoriaInstalacionAccesoResumen,
  PppoeAuditoriaInstalacionAuditoriaItem,
  PppoeAuditoriaInstalacionCuentaResumen,
  PppoeAuditoriaInstalacionEvento,
  PppoeAuditoriaInstalacionFindFilters,
  PppoeAuditoriaInstalacionOperacionItem,
  PppoeAuditoriaInstalacionPaginatedResult,
  PppoeAuditoriaInstalacionPaso,
  PppoeAuditoriaInstalacionPerfilResumen,
  PppoeAuditoriaInstalacionRouterResumen,
  PppoeAuditoriaInstalacionServicioResumen,
  PppoeAuditoriaInstalacionSummary,
  PppoeAuditoriaInstalacionTimelineItem,
  PppoeAuditoriaInstalacionUsuarioResumen,
} from '../../domain/read-models/pppoe-auditoria-instalacion.read-model';

import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../../domain/enums/pppoe-auditoria-enums';

import {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  EstadoPasoPppoe,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

const usuarioResumenSelect = {
  id: true,
  nombre: true,
  correo: true,
  telefono: true,
  rol: true,
  activo: true,
} satisfies Prisma.UsuarioSelect;

const routerResumenSelect = {
  id: true,
  nombre: true,
  host: true,
  sshPort: true,
  descripcion: true,
  activo: true,
} satisfies Prisma.MikrotikRouterSelect;

const servicioResumenSelect = {
  id: true,
  nombre: true,
  velocidad: true,
  precio: true,
  estado: true,
} satisfies Prisma.ServicioInternetSelect;

const accesoResumenSelect = {
  id: true,
  tecnologia: true,
  metodoAutenticacion: true,
  estado: true,

  activadoEn: true,
  suspendidoEn: true,
  dadoDeBajaEn: true,

  creadoEn: true,
  actualizadoEn: true,

  servicioInternet: {
    select: servicioResumenSelect,
  },
} satisfies Prisma.ClienteAccesoInternetSelect;

const perfilResumenSelect = {
  id: true,
  codigoPerfil: true,
  activo: true,

  mikrotikRouter: {
    select: routerResumenSelect,
  },

  servicioInternet: {
    select: servicioResumenSelect,
  },
} satisfies Prisma.PppoePerfilHomologacionSelect;

const cuentaResumenSelect = {
  id: true,
  accesoInternetId: true,
  usuario: true,
  estado: true,

  generadoEn: true,
  secretCreadoEn: true,
  activadoEn: true,
  suspendidoEn: true,
  eliminadoEn: true,

  ultimaSincronizacionEn: true,
  ultimoError: true,

  accesoInternet: {
    select: accesoResumenSelect,
  },

  perfilHomologacion: {
    select: perfilResumenSelect,
  },
} satisfies Prisma.ClientePppoeCuentaSelect;

const auditoriaEventoSelect = {
  id: true,

  empresaId: true,
  clienteId: true,
  accesoInternetId: true,
  cuentaPppoeId: true,
  perfilHomologacionId: true,
  instalacionId: true,
  operacionId: true,
  operadorId: true,

  origen: true,
  accion: true,

  descripcion: true,

  estadoCuentaAnterior: true,
  estadoCuentaNuevo: true,

  usuarioPppoeSnapshot: true,
  perfilCodigoSnapshot: true,
  operadorNombreSnapshot: true,

  datos: true,

  ipOrigen: true,
  userAgent: true,

  creadoEn: true,

  operador: {
    select: usuarioResumenSelect,
  },
} satisfies Prisma.PppoeAuditoriaSelect;

const operationTimelineSelect = {
  id: true,

  empresaId: true,
  cuentaPppoeId: true,
  mikrotikRouterId: true,
  perfilHomologacionId: true,
  instalacionId: true,

  reintentoDeId: true,
  numeroIntento: true,
  claveIdempotencia: true,

  tipo: true,
  origen: true,
  canal: true,
  estado: true,

  iniciadoPorId: true,
  reautenticadoPorId: true,

  requiereReautenticacion: true,
  reautenticacionExitosa: true,
  reautenticadoEn: true,

  usuarioPppoeSnapshot: true,
  codigoPerfilSnapshot: true,
  routerHostSnapshot: true,
  routerPuertoSnapshot: true,

  motivo: true,
  resultado: true,

  errorCodigo: true,
  errorMensaje: true,

  iniciadoEn: true,
  finalizadoEn: true,
  canceladoEn: true,
  duracionMs: true,

  creadoEn: true,
  actualizadoEn: true,

  iniciadoPor: {
    select: usuarioResumenSelect,
  },

  reautenticadoPor: {
    select: usuarioResumenSelect,
  },

  cuentaPppoe: {
    select: cuentaResumenSelect,
  },

  mikrotikRouter: {
    select: routerResumenSelect,
  },

  perfilHomologacion: {
    select: perfilResumenSelect,
  },

  auditorias: {
    orderBy: [
      {
        creadoEn: 'asc',
      },
      {
        id: 'asc',
      },
    ],

    select: auditoriaEventoSelect,
  },

  pasos: {
    orderBy: {
      orden: 'asc',
    },

    select: {
      id: true,
      operacionId: true,

      tipo: true,
      orden: true,
      estado: true,

      comandoSanitizado: true,
      respuestaSanitizada: true,

      errorCodigo: true,
      errorMensaje: true,

      iniciadoEn: true,
      finalizadoEn: true,
      duracionMs: true,

      creadoEn: true,
      actualizadoEn: true,
    },
  },
} satisfies Prisma.PppoeOperacionSelect;

const independentAuditTimelineSelect = {
  ...auditoriaEventoSelect,

  accesoInternet: {
    select: accesoResumenSelect,
  },

  cuentaPppoe: {
    select: cuentaResumenSelect,
  },

  perfilHomologacion: {
    select: perfilResumenSelect,
  },
} satisfies Prisma.PppoeAuditoriaSelect;

const instalacionSummarySelect = {
  id: true,
  empresaId: true,
  clienteId: true,
  estado: true,

  fechaProgramada: true,
  fechaInicio: true,
  fechaFinalizacion: true,
  fechaActivacionServicio: true,

  cliente: {
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      telefono: true,
    },
  },

  clienteInstalacionAccesos: {
    where: {
      accion: PrismaAccionInstalacionAcceso.CREADO,
    },

    orderBy: {
      creadoEn: 'desc',
    },

    select: {
      accesoInternet: {
        select: {
          ...accesoResumenSelect,

          cuentaPppoe: {
            select: cuentaResumenSelect,
          },
        },
      },
    },
  },
} satisfies Prisma.ClienteInstalacionSelect;

type OperationTimelineRecord = Prisma.PppoeOperacionGetPayload<{
  select: typeof operationTimelineSelect;
}>;

type IndependentAuditTimelineRecord = Prisma.PppoeAuditoriaGetPayload<{
  select: typeof independentAuditTimelineSelect;
}>;

type InstallationSummaryRecord = Prisma.ClienteInstalacionGetPayload<{
  select: typeof instalacionSummarySelect;
}>;

type TimelineKey = {
  type: 'OPERACION' | 'AUDITORIA';
  id: number;
  date: Date;
};

@Injectable()
export class PppoeAuditoriaInstalacionPrismaQuery
  implements PppoeAuditoriaInstalacionQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findTimelineByInstalacion(
    filters: PppoeAuditoriaInstalacionFindFilters,
  ): Promise<PppoeAuditoriaInstalacionPaginatedResult | null> {
    const page = Math.max(filters.page || 1, 1);
    const limit = Math.min(Math.max(filters.limit || 10, 1), 100);

    const installation = await this.prisma.clienteInstalacion.findFirst({
      where: {
        id: filters.instalacionId,
        empresaId: filters.empresaId,
      },

      select: instalacionSummarySelect,
    });

    if (!installation) {
      return null;
    }

    const operationContextWhere = this.buildOperationContextWhere(filters);

    const operationWhere = this.buildOperationWhere(
      filters,
      operationContextWhere,
    );

    const independentAuditWhere = this.buildIndependentAuditWhere(filters);

    const [operationKeys, auditKeys] = await this.prisma.$transaction([
      this.prisma.pppoeOperacion.findMany({
        where: operationWhere,

        select: {
          id: true,
          creadoEn: true,
        },
      }),

      this.prisma.pppoeAuditoria.findMany({
        where: independentAuditWhere,

        select: {
          id: true,
          creadoEn: true,
        },
      }),
    ]);

    const timelineKeys: TimelineKey[] = [
      ...operationKeys.map((item) => ({
        type: 'OPERACION' as const,
        id: item.id,
        date: item.creadoEn,
      })),

      ...auditKeys.map((item) => ({
        type: 'AUDITORIA' as const,
        id: item.id,
        date: item.creadoEn,
      })),
    ];

    timelineKeys.sort((left, right) => {
      const dateComparison = left.date.getTime() - right.date.getTime();

      if (dateComparison !== 0) {
        return filters.ordenDireccion === 'asc'
          ? dateComparison
          : -dateComparison;
      }

      const idComparison = left.id - right.id;

      if (idComparison !== 0) {
        return filters.ordenDireccion === 'asc' ? idComparison : -idComparison;
      }

      return left.type.localeCompare(right.type);
    });

    const total = timelineKeys.length;
    const skip = (page - 1) * limit;
    const pageKeys = timelineKeys.slice(skip, skip + limit);

    const operationIds = pageKeys
      .filter((item) => item.type === 'OPERACION')
      .map((item) => item.id);

    const auditIds = pageKeys
      .filter((item) => item.type === 'AUDITORIA')
      .map((item) => item.id);

    const [operations, independentAudits, summary] = await Promise.all([
      operationIds.length > 0
        ? this.prisma.pppoeOperacion.findMany({
            where: {
              id: {
                in: operationIds,
              },
            },

            select: operationTimelineSelect,
          })
        : Promise.resolve([] as OperationTimelineRecord[]),

      auditIds.length > 0
        ? this.prisma.pppoeAuditoria.findMany({
            where: {
              id: {
                in: auditIds,
              },
            },

            select: independentAuditTimelineSelect,
          })
        : Promise.resolve([] as IndependentAuditTimelineRecord[]),

      this.buildSummary(installation, filters, operationContextWhere),
    ]);

    const operationMap = new Map(
      operations.map((record) => [record.id, this.mapOperationItem(record)]),
    );

    const auditMap = new Map(
      independentAudits.map((record) => [
        record.id,
        this.mapIndependentAuditItem(record),
      ]),
    );

    const data: PppoeAuditoriaInstalacionTimelineItem[] = [];

    for (const key of pageKeys) {
      if (key.type === 'OPERACION') {
        const item = operationMap.get(key.id);

        if (item) {
          data.push(item);
        }

        continue;
      }

      const item = auditMap.get(key.id);

      if (item) {
        data.push(item);
      }
    }

    return {
      data,

      meta: {
        total,
        page,
        limit,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },

      summary,
    };
  }

  private buildOperationContextWhere(
    filters: PppoeAuditoriaInstalacionFindFilters,
  ): Prisma.PppoeOperacionWhereInput {
    return {
      empresaId: filters.empresaId,

      OR: [
        {
          instalacionId: filters.instalacionId,
        },

        {
          auditorias: {
            some: {
              instalacionId: filters.instalacionId,
            },
          },
        },
      ],
    };
  }

  private buildOperationWhere(
    filters: PppoeAuditoriaInstalacionFindFilters,
    contextWhere: Prisma.PppoeOperacionWhereInput,
  ): Prisma.PppoeOperacionWhereInput {
    const and: Prisma.PppoeOperacionWhereInput[] = [contextWhere];

    if (filters.tipoOperacion) {
      and.push({
        tipo: filters.tipoOperacion as unknown as PrismaTipoOperacionPppoe,
      });
    }

    if (filters.estadoOperacion) {
      and.push({
        estado:
          filters.estadoOperacion as unknown as PrismaEstadoOperacionPppoe,
      });
    }

    if (filters.origen) {
      and.push({
        origen: filters.origen as unknown as PrismaOrigenOperacionPppoe,
      });
    }

    if (filters.accion) {
      and.push({
        auditorias: {
          some: {
            accion: this.mapAuditAction(filters.accion),
          },
        },
      });
    }

    const createdAt = this.buildDateFilter(
      filters.fechaDesde,
      filters.fechaHasta,
    );

    if (createdAt) {
      and.push({
        creadoEn: createdAt,
      });
    }

    const search = filters.search?.trim();

    if (search) {
      and.push({
        OR: [
          {
            usuarioPppoeSnapshot: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            codigoPerfilSnapshot: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            routerHostSnapshot: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            motivo: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            errorCodigo: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            errorMensaje: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            iniciadoPor: {
              is: {
                OR: [
                  {
                    nombre: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    correo: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          },
          {
            cuentaPppoe: {
              is: {
                usuario: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            mikrotikRouter: {
              is: {
                OR: [
                  {
                    nombre: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    host: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          },
          {
            auditorias: {
              some: {
                OR: [
                  {
                    descripcion: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    operadorNombreSnapshot: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    ipOrigen: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          },
        ],
      });
    }

    return {
      AND: and,
    };
  }

  private buildIndependentAuditWhere(
    filters: PppoeAuditoriaInstalacionFindFilters,
  ): Prisma.PppoeAuditoriaWhereInput {
    /*
     * Cuando se filtra por campos propios de una operación,
     * los eventos independientes no participan.
     */
    if (filters.tipoOperacion || filters.estadoOperacion) {
      return {
        id: -1,
      };
    }

    const and: Prisma.PppoeAuditoriaWhereInput[] = [
      {
        empresaId: filters.empresaId,
        instalacionId: filters.instalacionId,
        operacionId: null,
      },
    ];

    if (filters.accion) {
      and.push({
        accion: this.mapAuditAction(filters.accion),
      });
    }

    if (filters.origen) {
      and.push({
        origen: filters.origen as unknown as PrismaOrigenOperacionPppoe,
      });
    }

    const createdAt = this.buildDateFilter(
      filters.fechaDesde,
      filters.fechaHasta,
    );

    if (createdAt) {
      and.push({
        creadoEn: createdAt,
      });
    }

    const search = filters.search?.trim();

    if (search) {
      and.push({
        OR: [
          {
            descripcion: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            usuarioPppoeSnapshot: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            perfilCodigoSnapshot: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            operadorNombreSnapshot: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            ipOrigen: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            operador: {
              is: {
                OR: [
                  {
                    nombre: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    correo: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          },
          {
            cuentaPppoe: {
              is: {
                usuario: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            perfilHomologacion: {
              is: {
                codigoPerfil: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      });
    }

    return {
      AND: and,
    };
  }

  private async buildSummary(
    installation: InstallationSummaryRecord,
    filters: PppoeAuditoriaInstalacionFindFilters,
    operationContextWhere: Prisma.PppoeOperacionWhereInput,
  ): Promise<PppoeAuditoriaInstalacionSummary> {
    const auditContextWhere: Prisma.PppoeAuditoriaWhereInput = {
      empresaId: filters.empresaId,

      OR: [
        {
          instalacionId: filters.instalacionId,
        },

        {
          operacion: {
            is: operationContextWhere,
          },
        },
      ],
    };

    const [
      operationStates,
      auditCount,
      stepCount,
      latestOperation,
      latestAudit,
    ] = await this.prisma.$transaction([
      this.prisma.pppoeOperacion.findMany({
        where: operationContextWhere,

        select: {
          estado: true,
        },
      }),

      this.prisma.pppoeAuditoria.count({
        where: auditContextWhere,
      }),

      this.prisma.pppoeOperacionPaso.count({
        where: {
          operacion: {
            is: operationContextWhere,
          },
        },
      }),

      this.prisma.pppoeOperacion.findFirst({
        where: operationContextWhere,

        orderBy: [
          {
            creadoEn: 'desc',
          },
          {
            id: 'desc',
          },
        ],

        select: {
          creadoEn: true,
        },
      }),

      this.prisma.pppoeAuditoria.findFirst({
        where: auditContextWhere,

        orderBy: [
          {
            creadoEn: 'desc',
          },
          {
            id: 'desc',
          },
        ],

        select: {
          creadoEn: true,
        },
      }),
    ]);

    const counts = new Map<PrismaEstadoOperacionPppoe, number>();

    for (const operation of operationStates) {
      const current = counts.get(operation.estado) ?? 0;

      counts.set(operation.estado, current + 1);
    }

    const totalOperaciones = operationStates.length;

    const pppoeAccesses = installation.clienteInstalacionAccesos
      .map((link) => link.accesoInternet)
      .filter(
        (access) =>
          access.tecnologia === PrismaTecnologiaAccesoInternet.FIBRA_GPON &&
          access.metodoAutenticacion ===
            PrismaMetodoAutenticacionInternet.PPPOE,
      );

    const accesosPppoe = pppoeAccesses.map((access) => ({
      ...this.mapAccess(access),

      cuentaPppoe: access.cuentaPppoe
        ? {
            id: access.cuentaPppoe.id,
            usuario: access.cuentaPppoe.usuario,

            estado: access.cuentaPppoe.estado as unknown as EstadoCuentaPppoe,

            perfilHomologacionId: access.cuentaPppoe.perfilHomologacion.id,

            mikrotikRouterId:
              access.cuentaPppoe.perfilHomologacion.mikrotikRouter.id,

            codigoPerfil: access.cuentaPppoe.perfilHomologacion.codigoPerfil,

            routerNombre:
              access.cuentaPppoe.perfilHomologacion.mikrotikRouter.nombre,
          }
        : null,
    }));

    const accountRecord =
      pppoeAccesses.find((access) => access.cuentaPppoe !== null)
        ?.cuentaPppoe ?? null;

    const latestActivityCandidates = [
      latestOperation?.creadoEn ?? null,
      latestAudit?.creadoEn ?? null,
    ].filter((value): value is Date => value !== null);

    const ultimaActividadEn =
      latestActivityCandidates.length > 0
        ? new Date(
            Math.max(...latestActivityCandidates.map((date) => date.getTime())),
          )
        : null;

    return {
      instalacion: {
        id: installation.id,
        empresaId: installation.empresaId,
        clienteId: installation.clienteId,
        estado: installation.estado,

        fechaProgramada: installation.fechaProgramada,
        fechaInicio: installation.fechaInicio,
        fechaFinalizacion: installation.fechaFinalizacion,
        fechaActivacionServicio: installation.fechaActivacionServicio,

        cliente: {
          id: installation.cliente.id,
          nombre: installation.cliente.nombre,
          apellidos: installation.cliente.apellidos,
          telefono: installation.cliente.telefono,
        },
      },

      totalEventos: auditCount,
      totalOperaciones,
      totalPasos: stepCount,

      operacionesExitosas: counts.get(PrismaEstadoOperacionPppoe.EXITOSA) ?? 0,

      operacionesFallidas: counts.get(PrismaEstadoOperacionPppoe.FALLIDA) ?? 0,

      operacionesParciales: counts.get(PrismaEstadoOperacionPppoe.PARCIAL) ?? 0,

      operacionesEnCurso:
        (counts.get(PrismaEstadoOperacionPppoe.PENDIENTE) ?? 0) +
        (counts.get(PrismaEstadoOperacionPppoe.AUTORIZADA) ?? 0) +
        (counts.get(PrismaEstadoOperacionPppoe.EJECUTANDO) ?? 0),

      operacionesCanceladas:
        counts.get(PrismaEstadoOperacionPppoe.CANCELADA) ?? 0,

      ultimaActividadEn,

      cantidadAccesosPppoe: pppoeAccesses.length,

      accesosPppoe,

      cuentaPppoe: accountRecord ? this.mapAccount(accountRecord) : null,
    };
  }

  private mapOperationItem(
    record: OperationTimelineRecord,
  ): PppoeAuditoriaInstalacionOperacionItem {
    return {
      tipoRegistro: 'OPERACION',
      fecha: record.creadoEn,

      operacion: {
        id: record.id,

        empresaId: record.empresaId,
        cuentaPppoeId: record.cuentaPppoeId,
        mikrotikRouterId: record.mikrotikRouterId,
        perfilHomologacionId: record.perfilHomologacionId,
        instalacionId: record.instalacionId,

        reintentoDeId: record.reintentoDeId,
        numeroIntento: record.numeroIntento,
        claveIdempotencia: record.claveIdempotencia,

        tipo: record.tipo as unknown as TipoOperacionPppoe,

        origen: record.origen as unknown as OrigenOperacionPppoe,

        canal: record.canal as unknown as CanalOperacionPppoe,

        estado: record.estado as unknown as EstadoOperacionPppoe,

        iniciadoPorId: record.iniciadoPorId,
        reautenticadoPorId: record.reautenticadoPorId,

        requiereReautenticacion: record.requiereReautenticacion,

        reautenticacionExitosa: record.reautenticacionExitosa,

        reautenticadoEn: record.reautenticadoEn,

        usuarioPppoeSnapshot: record.usuarioPppoeSnapshot,

        codigoPerfilSnapshot: record.codigoPerfilSnapshot,

        routerHostSnapshot: record.routerHostSnapshot,

        routerPuertoSnapshot: record.routerPuertoSnapshot,

        motivo: record.motivo,
        resultado: record.resultado,

        errorCodigo: record.errorCodigo,
        errorMensaje: record.errorMensaje,

        iniciadoEn: record.iniciadoEn,
        finalizadoEn: record.finalizadoEn,
        canceladoEn: record.canceladoEn,
        duracionMs: record.duracionMs,

        creadoEn: record.creadoEn,
        actualizadoEn: record.actualizadoEn,
      },

      actores: {
        iniciadoPor: record.iniciadoPor
          ? this.mapUser(record.iniciadoPor)
          : null,

        reautenticadoPor: record.reautenticadoPor
          ? this.mapUser(record.reautenticadoPor)
          : null,
      },

      contexto: {
        accesoInternet: this.mapAccess(record.cuentaPppoe.accesoInternet),

        cuentaPppoe: {
          id: record.cuentaPppoe.id,
          accesoInternetId: record.cuentaPppoe.accesoInternetId,
          usuario: record.cuentaPppoe.usuario,

          estado: record.cuentaPppoe.estado as unknown as EstadoCuentaPppoe,

          generadoEn: record.cuentaPppoe.generadoEn,

          secretCreadoEn: record.cuentaPppoe.secretCreadoEn,

          activadoEn: record.cuentaPppoe.activadoEn,

          suspendidoEn: record.cuentaPppoe.suspendidoEn,

          eliminadoEn: record.cuentaPppoe.eliminadoEn,

          ultimaSincronizacionEn: record.cuentaPppoe.ultimaSincronizacionEn,

          ultimoError: record.cuentaPppoe.ultimoError,
        },

        router: this.mapRouter(record.mikrotikRouter),

        perfilHomologacion: record.perfilHomologacion
          ? this.mapProfile(record.perfilHomologacion)
          : null,
      },

      auditorias: record.auditorias.map((audit) => this.mapAudit(audit)),

      pasos: record.pasos.map((step) => this.mapStep(step)),
    };
  }

  private mapIndependentAuditItem(
    record: IndependentAuditTimelineRecord,
  ): PppoeAuditoriaInstalacionAuditoriaItem {
    return {
      tipoRegistro: 'AUDITORIA',
      fecha: record.creadoEn,

      auditoria: this.mapAudit(record),

      contexto: {
        accesoInternet: record.accesoInternet
          ? this.mapAccess(record.accesoInternet)
          : null,

        cuentaPppoe: record.cuentaPppoe
          ? this.mapAccount(record.cuentaPppoe)
          : null,

        perfilHomologacion: record.perfilHomologacion
          ? this.mapProfile(record.perfilHomologacion)
          : null,
      },
    };
  }

  private mapAudit(
    record: Prisma.PppoeAuditoriaGetPayload<{
      select: typeof auditoriaEventoSelect;
    }>,
  ): PppoeAuditoriaInstalacionEvento {
    return {
      id: record.id,

      empresaId: record.empresaId,
      clienteId: record.clienteId,
      accesoInternetId: record.accesoInternetId,
      cuentaPppoeId: record.cuentaPppoeId,
      perfilHomologacionId: record.perfilHomologacionId,
      instalacionId: record.instalacionId,
      operacionId: record.operacionId,
      operadorId: record.operadorId,

      origen: record.origen as unknown as OrigenOperacionPppoe,

      accion: record.accion as unknown as AccionAuditoriaPppoe,

      descripcion: record.descripcion,

      estadoCuentaAnterior:
        record.estadoCuentaAnterior as unknown as EstadoCuentaPppoe | null,

      estadoCuentaNuevo:
        record.estadoCuentaNuevo as unknown as EstadoCuentaPppoe | null,

      usuarioPppoeSnapshot: record.usuarioPppoeSnapshot,

      perfilCodigoSnapshot: record.perfilCodigoSnapshot,

      operadorNombreSnapshot: record.operadorNombreSnapshot,

      datos: record.datos,

      ipOrigen: record.ipOrigen,

      userAgent: record.userAgent,

      creadoEn: record.creadoEn,

      operador: record.operador ? this.mapUser(record.operador) : null,
    };
  }

  private mapStep(
    record: OperationTimelineRecord['pasos'][number],
  ): PppoeAuditoriaInstalacionPaso {
    return {
      id: record.id,
      operacionId: record.operacionId,

      tipo: record.tipo as unknown as TipoPasoPppoe,

      orden: record.orden,

      estado: record.estado as unknown as EstadoPasoPppoe,

      comandoSanitizado: record.comandoSanitizado,

      respuestaSanitizada: record.respuestaSanitizada,

      errorCodigo: record.errorCodigo,

      errorMensaje: record.errorMensaje,

      iniciadoEn: record.iniciadoEn,

      finalizadoEn: record.finalizadoEn,

      duracionMs: record.duracionMs,

      creadoEn: record.creadoEn,

      actualizadoEn: record.actualizadoEn,
    };
  }

  private mapUser(
    record: Prisma.UsuarioGetPayload<{
      select: typeof usuarioResumenSelect;
    }>,
  ): PppoeAuditoriaInstalacionUsuarioResumen {
    return {
      id: record.id,
      nombre: record.nombre,
      correo: record.correo,
      telefono: record.telefono,
      rol: record.rol,
      activo: record.activo,
    };
  }

  private mapRouter(
    record: Prisma.MikrotikRouterGetPayload<{
      select: typeof routerResumenSelect;
    }>,
  ): PppoeAuditoriaInstalacionRouterResumen {
    return {
      id: record.id,
      nombre: record.nombre,
      host: record.host,
      sshPort: record.sshPort,
      descripcion: record.descripcion,
      activo: record.activo,
    };
  }

  private mapService(
    record: Prisma.ServicioInternetGetPayload<{
      select: typeof servicioResumenSelect;
    }>,
  ): PppoeAuditoriaInstalacionServicioResumen {
    return {
      id: record.id,
      nombre: record.nombre,
      velocidad: record.velocidad,
      precio: record.precio,
      estado: record.estado,
    };
  }

  private mapAccess(
    record: Prisma.ClienteAccesoInternetGetPayload<{
      select: typeof accesoResumenSelect;
    }>,
  ): PppoeAuditoriaInstalacionAccesoResumen {
    return {
      id: record.id,
      tecnologia: record.tecnologia,
      metodoAutenticacion: record.metodoAutenticacion,
      estado: record.estado,

      activadoEn: record.activadoEn,
      suspendidoEn: record.suspendidoEn,
      dadoDeBajaEn: record.dadoDeBajaEn,

      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,

      servicioInternet: record.servicioInternet
        ? this.mapService(record.servicioInternet)
        : null,
    };
  }

  private mapProfile(
    record: Prisma.PppoePerfilHomologacionGetPayload<{
      select: typeof perfilResumenSelect;
    }>,
  ): PppoeAuditoriaInstalacionPerfilResumen {
    return {
      id: record.id,
      codigoPerfil: record.codigoPerfil,
      activo: record.activo,

      router: this.mapRouter(record.mikrotikRouter),

      servicioInternet: this.mapService(record.servicioInternet),
    };
  }

  private mapAccount(
    record: Prisma.ClientePppoeCuentaGetPayload<{
      select: typeof cuentaResumenSelect;
    }>,
  ): PppoeAuditoriaInstalacionCuentaResumen {
    return {
      id: record.id,
      accesoInternetId: record.accesoInternetId,
      usuario: record.usuario,

      estado: record.estado as unknown as EstadoCuentaPppoe,

      generadoEn: record.generadoEn,
      secretCreadoEn: record.secretCreadoEn,
      activadoEn: record.activadoEn,
      suspendidoEn: record.suspendidoEn,
      eliminadoEn: record.eliminadoEn,

      ultimaSincronizacionEn: record.ultimaSincronizacionEn,

      ultimoError: record.ultimoError,

      accesoInternet: this.mapAccess(record.accesoInternet),

      perfilHomologacion: this.mapProfile(record.perfilHomologacion),
    };
  }

  private mapAuditAction(
    action: AccionAuditoriaPppoe,
  ): PrismaAccionAuditoriaPppoe {
    const allowed = Object.values(PrismaAccionAuditoriaPppoe) as string[];

    if (!allowed.includes(action)) {
      throw new BadRequestException(
        `La acción de auditoría ${action} no está disponible en el schema Prisma actual.`,
      );
    }

    return action as unknown as PrismaAccionAuditoriaPppoe;
  }

  private buildDateFilter(
    dateFrom?: Date | null,
    dateTo?: Date | null,
  ): Prisma.DateTimeFilter | undefined {
    if (!dateFrom && !dateTo) {
      return undefined;
    }

    return {
      ...(dateFrom
        ? {
            gte: dateFrom,
          }
        : {}),

      ...(dateTo
        ? {
            lte: dateTo,
          }
        : {}),
    };
  }
}
