import { Injectable, Logger } from '@nestjs/common';

import {
  AccionAuditoriaPppoe as PrismaAccionAuditoriaPppoe,
  OrigenOperacionPppoe as PrismaOrigenOperacionPppoe,
  Prisma,
} from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  BuscarAuditoriasPppoeParams,
  PppoeAuditoriaOrdenCampo,
  PppoeAuditoriaOrdenDireccion,
  PppoeAuditoriaRepositoryPort,
} from '../../domain/ports/pppoe-auditoria-repository';
import { PppoeAuditoriaEntity } from '../../domain/entities/pppoe-auditoria.entity';
import { PppoeAuditoriaPrismaMapper } from './pppoe-auditoria-mapper.prisma';
import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../../domain/enums/pppoe-auditoria-enums';
import {
  PppoeAuditoriaFindManyFilters,
  PppoeAuditoriaListItem,
  PppoeAuditoriaPaginatedResult,
} from '../../domain/read-models/pppoe-auditoria-list.read-model';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

const pppoeAuditoriaListSelect = {
  id: true,

  empresaId: true,

  clienteId: true,
  accesoInternetId: true,
  cuentaPppoeId: true,
  perfilHomologacionId: true,

  instalacionId: true,
  desinstalacionId: true,
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

  empresa: {
    select: {
      id: true,
      nombre: true,
      telefono: true,
      correo: true,
    },
  },

  cliente: {
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      telefono: true,
      dpi: true,
      direccion: true,
    },
  },

  operador: {
    select: {
      id: true,
      nombre: true,
      correo: true,
      telefono: true,
      rol: true,
      activo: true,
    },
  },

  accesoInternet: {
    select: {
      id: true,

      tecnologia: true,
      metodoAutenticacion: true,
      estado: true,

      creadoEn: true,

      servicioInternet: {
        select: {
          id: true,
          nombre: true,
          velocidad: true,
          precio: true,
          estado: true,
        },
      },
    },
  },

  cuentaPppoe: {
    select: {
      id: true,

      usuario: true,
      estado: true,

      generadoEn: true,
      activadoEn: true,
      suspendidoEn: true,
      eliminadoEn: true,

      ultimaSincronizacionEn: true,
      ultimoError: true,
    },
  },

  perfilHomologacion: {
    select: {
      id: true,

      codigoPerfil: true,
      activo: true,

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

      servicioInternet: {
        select: {
          id: true,
          nombre: true,
          velocidad: true,
          precio: true,
          estado: true,
        },
      },
    },
  },

  instalacion: {
    select: {
      id: true,

      tipo: true,
      estado: true,

      fechaProgramada: true,
      fechaInicio: true,
      fechaFinalizacion: true,
    },
  },

  desinstalacion: {
    select: {
      id: true,

      tipo: true,
      motivo: true,
      estado: true,

      fechaProgramada: true,
      fechaInicio: true,
      fechaFinalizacion: true,
    },
  },

  operacion: {
    select: {
      id: true,

      tipo: true,
      origen: true,
      estado: true,

      motivo: true,

      errorCodigo: true,
      errorMensaje: true,

      iniciadoEn: true,
      finalizadoEn: true,

      creadoEn: true,

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
} satisfies Prisma.PppoeAuditoriaSelect;

type PppoeAuditoriaListRecord = Prisma.PppoeAuditoriaGetPayload<{
  select: typeof pppoeAuditoriaListSelect;
}>;

@Injectable()
export class PppoeAuditoriaPrismaRepository
  implements PppoeAuditoriaRepositoryPort
{
  private readonly logger = new Logger(PppoeAuditoriaPrismaRepository.name);
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 25;
  private static readonly MAX_LIMIT = 100;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inserta un nuevo registro en la bitácora.
   *
   * No existen update() ni delete() porque la auditoría
   * es append-only.
   */
  async create(entity: PppoeAuditoriaEntity): Promise<PppoeAuditoriaEntity> {
    const record = await this.prisma.pppoeAuditoria.create({
      data: PppoeAuditoriaPrismaMapper.toCreatePersistence(entity),
    });

    return PppoeAuditoriaPrismaMapper.toDomain(record);
  }

  async findById(id: number): Promise<PppoeAuditoriaEntity | null> {
    this.assertPositiveInteger(id, 'id');

    const record = await this.prisma.pppoeAuditoria.findUnique({
      where: {
        id,
      },
    });

    return record ? PppoeAuditoriaPrismaMapper.toDomain(record) : null;
  }

  /**
   * Consulta administrativa general.
   *
   * Permite combinar contexto, acción, origen,
   * operador y rango de fechas.
   */
  async findPaginated(
    params: BuscarAuditoriasPppoeParams,
  ): Promise<PppoeAuditoriaPaginatedResult> {
    this.logger.log(
      `params recibido en paginated:\n${JSON.stringify(params, null, 2)}`,
    );

    const page = this.normalizePage(params.page);

    const limit = this.normalizeLimit(params.limit);

    const where = this.buildWhere(params);

    const orderBy = this.buildOrderBy(params.ordenPor, params.ordenDireccion);

    const skip = (page - 1) * limit;

    const [records, total] = await this.prisma.$transaction([
      this.prisma.pppoeAuditoria.findMany({
        where,

        skip,
        take: limit,

        orderBy,

        select: pppoeAuditoriaListSelect,
      }),

      this.prisma.pppoeAuditoria.count({
        where,
      }),
    ]);

    return {
      data: records.map((record) => this.mapListItem(record)),

      meta: {
        total,

        page,

        limit,

        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  /**
   * Línea de tiempo completa de una cuenta PPPoE.
   */
  async findByCuentaPppoeId(
    cuentaPppoeId: number,
  ): Promise<PppoeAuditoriaEntity[]> {
    this.assertPositiveInteger(cuentaPppoeId, 'cuentaPppoeId');

    return this.findManyByContext({
      cuentaPppoeId,
    });
  }

  /**
   * Eventos funcionales registrados para una
   * PppoeOperacion concreta.
   */
  async findByOperacionId(
    operacionId: number,
  ): Promise<PppoeAuditoriaEntity[]> {
    this.assertPositiveInteger(operacionId, 'operacionId');

    return this.findManyByContext({
      operacionId,
    });
  }

  /**
   * Bitácora generada durante una instalación.
   */
  async findByInstalacionId(
    instalacionId: number,
  ): Promise<PppoeAuditoriaEntity[]> {
    this.assertPositiveInteger(instalacionId, 'instalacionId');

    return this.findManyByContext({
      instalacionId,
    });
  }

  /**
   * Bitácora generada durante una desinstalación.
   */
  async findByDesinstalacionId(
    desinstalacionId: number,
  ): Promise<PppoeAuditoriaEntity[]> {
    this.assertPositiveInteger(desinstalacionId, 'desinstalacionId');

    return this.findManyByContext({
      desinstalacionId,
    });
  }

  /**
   * Historial PPPoE general de un cliente.
   *
   * Puede contener varios accesos, cuentas,
   * instalaciones y desinstalaciones.
   */
  async findByClienteId(clienteId: number): Promise<PppoeAuditoriaEntity[]> {
    this.assertPositiveInteger(clienteId, 'clienteId');

    return this.findManyByContext({
      clienteId,
    });
  }

  /**
   * Historial de un acceso de internet concreto.
   */
  async findByAccesoInternetId(
    accesoInternetId: number,
  ): Promise<PppoeAuditoriaEntity[]> {
    this.assertPositiveInteger(accesoInternetId, 'accesoInternetId');

    return this.findManyByContext({
      accesoInternetId,
    });
  }

  /**
   * Historial de creación y mantenimiento
   * de una homologación.
   */
  async findByPerfilHomologacionId(
    perfilHomologacionId: number,
  ): Promise<PppoeAuditoriaEntity[]> {
    this.assertPositiveInteger(perfilHomologacionId, 'perfilHomologacionId');

    return this.findManyByContext({
      perfilHomologacionId,
    });
  }

  async findMany(
    filters: PppoeAuditoriaFindManyFilters,
  ): Promise<PppoeAuditoriaPaginatedResult> {
    const page = Math.max(filters.page || 1, 1);

    const limit = Math.min(Math.max(filters.limit || 10, 1), 100);

    const skip = (page - 1) * limit;

    const where: Prisma.PppoeAuditoriaWhereInput = {
      empresaId: filters.empresaId,
    };
    if (filters.accion) {
      where.accion = this.mapAccionToPrisma(filters.accion);
    }

    if (filters.origen) {
      where.origen = this.mapOrigenToPrisma(filters.origen);
    }

    if (filters.clienteId) {
      where.clienteId = filters.clienteId;
    }

    if (filters.instalacionId) {
      where.instalacionId = filters.instalacionId;
    }

    if (filters.accesoInternetId) {
      where.accesoInternetId = filters.accesoInternetId;
    }

    if (filters.cuentaPppoeId) {
      where.cuentaPppoeId = filters.cuentaPppoeId;
    }

    if (filters.perfilHomologacionId) {
      where.perfilHomologacionId = filters.perfilHomologacionId;
    }

    if (filters.operadorId) {
      where.operadorId = filters.operadorId;
    }

    if (filters.fechaDesde || filters.fechaHasta) {
      where.creadoEn = {
        ...(filters.fechaDesde
          ? {
              gte: filters.fechaDesde,
            }
          : {}),

        ...(filters.fechaHasta
          ? {
              lte: filters.fechaHasta,
            }
          : {}),
      };
    }

    const search = filters.search?.trim();

    if (search) {
      where.OR = [
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
          cliente: {
            is: {
              OR: [
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
                  telefono: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  dpi: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            },
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
      ];
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.pppoeAuditoria.findMany({
        where,

        skip,
        take: limit,

        orderBy: [
          {
            creadoEn: 'desc',
          },
          {
            id: 'desc',
          },
        ],

        select: pppoeAuditoriaListSelect,
      }),

      this.prisma.pppoeAuditoria.count({
        where,
      }),
    ]);

    return {
      data: records.map((record) => this.mapListItem(record)),

      meta: {
        total,

        page,

        limit,

        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  private mapAccionToPrisma(
    value: AccionAuditoriaPppoe,
  ): PrismaAccionAuditoriaPppoe {
    const prismaValues = Object.values(PrismaAccionAuditoriaPppoe) as string[];

    if (!prismaValues.includes(value)) {
      throw new Error(`La acción de auditoría "${value}" no existe en Prisma.`);
    }

    return value as PrismaAccionAuditoriaPppoe;
  }

  private mapOrigenToPrisma(
    value: OrigenOperacionPppoe,
  ): PrismaOrigenOperacionPppoe {
    const prismaValues = Object.values(PrismaOrigenOperacionPppoe) as string[];

    if (!prismaValues.includes(value)) {
      throw new Error(`El origen de auditoría "${value}" no existe en Prisma.`);
    }

    return value as PrismaOrigenOperacionPppoe;
  }

  private mapRouter(router: {
    id: number;
    nombre: string;
    host: string;
    sshPort: number;
    descripcion: string | null;
    activo: boolean;
  }) {
    return {
      id: router.id,

      nombre: router.nombre,

      host: router.host,

      sshPort: router.sshPort,

      descripcion: router.descripcion,

      activo: router.activo,
    };
  }

  private mapServicio(servicio: {
    id: number;
    nombre: string;
    velocidad: string | null;
    precio: number;
    estado: unknown;
  }) {
    return {
      id: servicio.id,

      nombre: servicio.nombre,

      velocidad: servicio.velocidad,

      precio: Number(servicio.precio),

      estado: String(servicio.estado),
    };
  }

  private mapEnum<T extends string>(
    value: string,
    allowedValues: readonly T[],
    field: string,
  ): T {
    if (!allowedValues.includes(value as T)) {
      throw new Error(
        `El valor "${value}" de ${field} no está soportado por el dominio.`,
      );
    }

    return value as T;
  }

  private mapNullableEnum<T extends string>(
    value: string | null,
    allowedValues: readonly T[],
    field: string,
  ): T | null {
    if (value === null) {
      return null;
    }

    return this.mapEnum(value, allowedValues, field);
  }

  private mapListItem(
    record: PppoeAuditoriaListRecord,
  ): PppoeAuditoriaListItem {
    return {
      id: record.id,

      empresaId: record.empresaId,

      clienteId: record.clienteId,

      accesoInternetId: record.accesoInternetId,

      cuentaPppoeId: record.cuentaPppoeId,

      perfilHomologacionId: record.perfilHomologacionId,

      instalacionId: record.instalacionId,

      desinstalacionId: record.desinstalacionId,

      operacionId: record.operacionId,

      operadorId: record.operadorId,

      origen: this.mapEnum(
        record.origen,
        Object.values(OrigenOperacionPppoe),
        'origen',
      ),

      accion: this.mapEnum(
        record.accion,
        Object.values(AccionAuditoriaPppoe),
        'accion',
      ),

      descripcion: record.descripcion,

      estadoCuentaAnterior: this.mapNullableEnum(
        record.estadoCuentaAnterior,
        Object.values(EstadoCuentaPppoe),
        'estadoCuentaAnterior',
      ),

      estadoCuentaNuevo: this.mapNullableEnum(
        record.estadoCuentaNuevo,
        Object.values(EstadoCuentaPppoe),
        'estadoCuentaNuevo',
      ),

      usuarioPppoeSnapshot: record.usuarioPppoeSnapshot,

      perfilCodigoSnapshot: record.perfilCodigoSnapshot,

      operadorNombreSnapshot: record.operadorNombreSnapshot,

      datos: record.datos ?? null,

      ipOrigen: record.ipOrigen,

      userAgent: record.userAgent,

      creadoEn: record.creadoEn,

      empresa: {
        id: record.empresa.id,

        nombre: record.empresa.nombre,

        telefono: record.empresa.telefono,

        correo: record.empresa.correo,
      },

      cliente: record.cliente
        ? {
            id: record.cliente.id,

            nombre: record.cliente.nombre,

            apellidos: record.cliente.apellidos,

            telefono: record.cliente.telefono,

            dpi: record.cliente.dpi,

            direccion: record.cliente.direccion,
          }
        : null,

      operador: record.operador
        ? {
            id: record.operador.id,

            nombre: record.operador.nombre,

            correo: record.operador.correo,

            telefono: record.operador.telefono,

            rol: String(record.operador.rol),

            activo: record.operador.activo,
          }
        : null,

      accesoInternet: record.accesoInternet
        ? {
            id: record.accesoInternet.id,

            tecnologia: String(record.accesoInternet.tecnologia),

            metodoAutenticacion: String(
              record.accesoInternet.metodoAutenticacion,
            ),

            estado: String(record.accesoInternet.estado),

            creadoEn: record.accesoInternet.creadoEn,

            servicioInternet: record.accesoInternet.servicioInternet
              ? this.mapServicio(record.accesoInternet.servicioInternet)
              : null,
          }
        : null,

      cuentaPppoe: record.cuentaPppoe
        ? {
            id: record.cuentaPppoe.id,

            usuario: record.cuentaPppoe.usuario,

            estado: this.mapEnum(
              record.cuentaPppoe.estado,
              Object.values(EstadoCuentaPppoe),
              'cuentaPppoe.estado',
            ),

            generadoEn: record.cuentaPppoe.generadoEn,

            activadoEn: record.cuentaPppoe.activadoEn,

            suspendidoEn: record.cuentaPppoe.suspendidoEn,

            eliminadoEn: record.cuentaPppoe.eliminadoEn,

            ultimaSincronizacionEn: record.cuentaPppoe.ultimaSincronizacionEn,

            ultimoError: record.cuentaPppoe.ultimoError,
          }
        : null,

      perfilHomologacion: record.perfilHomologacion
        ? {
            id: record.perfilHomologacion.id,

            codigoPerfil: record.perfilHomologacion.codigoPerfil,

            activo: record.perfilHomologacion.activo,

            mikrotikRouter: this.mapRouter(
              record.perfilHomologacion.mikrotikRouter,
            ),

            servicioInternet: this.mapServicio(
              record.perfilHomologacion.servicioInternet,
            ),
          }
        : null,

      instalacion: record.instalacion
        ? {
            id: record.instalacion.id,

            tipo: String(record.instalacion.tipo),

            estado: String(record.instalacion.estado),

            fechaProgramada: record.instalacion.fechaProgramada,

            fechaInicio: record.instalacion.fechaInicio,

            fechaFinalizacion: record.instalacion.fechaFinalizacion,
          }
        : null,

      desinstalacion: record.desinstalacion
        ? {
            id: record.desinstalacion.id,

            tipo: String(record.desinstalacion.tipo),

            motivo: record.desinstalacion.motivo
              ? String(record.desinstalacion.motivo)
              : null,

            estado: String(record.desinstalacion.estado),

            fechaProgramada: record.desinstalacion.fechaProgramada,

            fechaInicio: record.desinstalacion.fechaInicio,

            fechaFinalizacion: record.desinstalacion.fechaFinalizacion,
          }
        : null,

      operacion: record.operacion
        ? {
            id: record.operacion.id,

            tipo: String(record.operacion.tipo),

            origen: this.mapEnum(
              record.operacion.origen,
              Object.values(OrigenOperacionPppoe),
              'operacion.origen',
            ),

            estado: String(record.operacion.estado),

            motivo: record.operacion.motivo,

            errorCodigo: record.operacion.errorCodigo,

            errorMensaje: record.operacion.errorMensaje,

            iniciadoEn: record.operacion.iniciadoEn,

            finalizadoEn: record.operacion.finalizadoEn,

            creadoEn: record.operacion.creadoEn,

            mikrotikRouter: this.mapRouter(record.operacion.mikrotikRouter),
          }
        : null,
    };
  }

  /**
   * Ejecuta las consultas especializadas de historial.
   *
   * Se ordena por fecha y luego por id para mantener
   * un resultado determinista cuando dos eventos tienen
   * la misma marca de tiempo.
   */
  private async findManyByContext(
    where: Prisma.PppoeAuditoriaWhereInput,
  ): Promise<PppoeAuditoriaEntity[]> {
    const records = await this.prisma.pppoeAuditoria.findMany({
      where,

      orderBy: [
        {
          creadoEn: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    });

    return records.map((record) => PppoeAuditoriaPrismaMapper.toDomain(record));
  }

  private buildWhere(
    params: BuscarAuditoriasPppoeParams,
  ): Prisma.PppoeAuditoriaWhereInput {
    this.assertPositiveInteger(params.empresaId, 'empresaId');

    const where: Prisma.PppoeAuditoriaWhereInput = {
      empresaId: params.empresaId,
    };

    if (params.clienteId != null) {
      this.assertPositiveInteger(params.clienteId, 'clienteId');

      where.clienteId = params.clienteId;
    }
    if (params.instalacionId != null) {
      this.assertPositiveInteger(params.instalacionId, 'instalacionId');

      where.instalacionId = params.instalacionId;
    }

    if (params.accesoInternetId != null) {
      this.assertPositiveInteger(params.accesoInternetId, 'accesoInternetId');

      where.accesoInternetId = params.accesoInternetId;
    }

    if (params.cuentaPppoeId != null) {
      this.assertPositiveInteger(params.cuentaPppoeId, 'cuentaPppoeId');

      where.cuentaPppoeId = params.cuentaPppoeId;
    }

    if (params.perfilHomologacionId != null) {
      this.assertPositiveInteger(
        params.perfilHomologacionId,
        'perfilHomologacionId',
      );

      where.perfilHomologacionId = params.perfilHomologacionId;
    }

    if (params.operadorId != null) {
      this.assertPositiveInteger(params.operadorId, 'operadorId');

      where.operadorId = params.operadorId;
    }

    if (params.origen != null) {
      where.origen = this.toPrismaOrigen(params.origen);
    }

    if (params.accion != null) {
      where.accion = this.toPrismaAccion(params.accion);
    }

    if (params.creadoDesde !== undefined || params.creadoHasta !== undefined) {
      this.assertDateRange(params.creadoDesde, params.creadoHasta);

      where.creadoEn = {
        ...(params.creadoDesde
          ? {
              gte: new Date(params.creadoDesde),
            }
          : {}),

        ...(params.creadoHasta
          ? {
              lte: new Date(params.creadoHasta),
            }
          : {}),
      };
    }

    return where;
  }

  /**
   * Resuelve los filtros accion y acciones sin crear
   * una condición ambigua.
   *
   * Cuando accion está presente, representa un filtro
   * exacto. Si también se envía acciones, la acción
   * exacta debe estar incluida en la colección.
   */
  private resolveAcciones(
    accion: AccionAuditoriaPppoe | undefined,

    acciones: AccionAuditoriaPppoe[] | undefined,
  ): AccionAuditoriaPppoe[] {
    const uniqueActions = [...new Set(acciones ?? [])];

    if (accion === undefined) {
      return uniqueActions;
    }

    if (uniqueActions.length > 0 && !uniqueActions.includes(accion)) {
      throw new Error(
        'El filtro accion no coincide con el conjunto indicado en acciones.',
      );
    }

    return [accion];
  }

  private buildOrderBy(
    field: PppoeAuditoriaOrdenCampo | undefined,

    direction: PppoeAuditoriaOrdenDireccion | undefined,
  ): Prisma.PppoeAuditoriaOrderByWithRelationInput[] {
    const orderField = field ?? 'creadoEn';

    const orderDirection = direction ?? 'desc';

    switch (orderField) {
      case 'accion':
        return [
          {
            accion: orderDirection,
          },
          {
            creadoEn: 'desc',
          },
          {
            id: 'desc',
          },
        ];

      case 'origen':
        return [
          {
            origen: orderDirection,
          },
          {
            creadoEn: 'desc',
          },
          {
            id: 'desc',
          },
        ];

      case 'creadoEn':
        return [
          {
            creadoEn: orderDirection,
          },
          {
            id: orderDirection,
          },
        ];

      default: {
        const exhaustiveCheck: never = orderField;

        throw new Error(
          `Campo de ordenamiento no soportado: ${exhaustiveCheck}.`,
        );
      }
    }
  }

  private normalizePage(value: number | undefined): number {
    const page = value ?? PppoeAuditoriaPrismaRepository.DEFAULT_PAGE;

    this.assertPositiveInteger(page, 'page');

    return page;
  }

  private normalizeLimit(value: number | undefined): number {
    const limit = value ?? PppoeAuditoriaPrismaRepository.DEFAULT_LIMIT;

    this.assertPositiveInteger(limit, 'limit');

    if (limit > PppoeAuditoriaPrismaRepository.MAX_LIMIT) {
      throw new Error(
        `limit no puede ser mayor que ${
          PppoeAuditoriaPrismaRepository.MAX_LIMIT
        }.`,
      );
    }

    return limit;
  }

  private assertDateRange(
    desde: Date | undefined,
    hasta: Date | undefined,
  ): void {
    if (desde !== undefined) {
      this.assertValidDate(desde, 'creadoDesde');
    }

    if (hasta !== undefined) {
      this.assertValidDate(hasta, 'creadoHasta');
    }

    if (
      desde !== undefined &&
      hasta !== undefined &&
      desde.getTime() > hasta.getTime()
    ) {
      throw new Error('creadoDesde no puede ser posterior a creadoHasta.');
    }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }

  private assertValidDate(value: Date, field: string): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new Error(`${field} debe ser una fecha válida.`);
    }
  }

  private toPrismaOrigen(
    value: OrigenOperacionPppoe,
  ): PrismaOrigenOperacionPppoe {
    if (
      !Object.values(PrismaOrigenOperacionPppoe).includes(
        value as PrismaOrigenOperacionPppoe,
      )
    ) {
      throw new Error(`Origen PPPoE no reconocido por Prisma: ${value}.`);
    }

    return value as PrismaOrigenOperacionPppoe;
  }

  private toPrismaAccion(
    value: AccionAuditoriaPppoe,
  ): PrismaAccionAuditoriaPppoe {
    if (
      !Object.values(PrismaAccionAuditoriaPppoe).includes(
        value as PrismaAccionAuditoriaPppoe,
      )
    ) {
      throw new Error(
        `Acción de auditoría PPPoE no reconocida por Prisma: ${value}.`,
      );
    }

    return value as PrismaAccionAuditoriaPppoe;
  }

  // HELPERS DE PAGINADOS
}
