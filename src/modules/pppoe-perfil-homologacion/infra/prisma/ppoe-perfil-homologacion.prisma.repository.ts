import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  BuscarPerfilPorRouterCodigoParams,
  BuscarPerfilPorRouterServicioParams,
  PerfilHomologacionRepositoryPort,
} from '../../domain/ports/ppoe-perfil-homologacion.port';
import { PerfilHomologacionEntity } from '../../domain/entities/ppoe-perfil-homologacion.entity';
import { PerfilHomologacionPrismaMapper } from './ppoe-perfil-homologacion.mapper.prisma';
import { Prisma } from '@prisma/client';
import {
  PerfilHomologacionDetalle,
  PerfilHomologacionFindManyFilters,
  PerfilHomologacionListItem,
  PerfilHomologacionPaginatedResult,
  PerfilHomologacionSeleccionable,
  PerfilHomologacionSeleccionableFilters,
} from '../../domain/models/pppoe-perfil-homologacion.read-model';

const perfilHomologacionReadInclude = {
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

  creadoPor: {
    select: {
      id: true,
      nombre: true,
      correo: true,
      rol: true,
      activo: true,
    },
  },

  actualizadoPor: {
    select: {
      id: true,
      nombre: true,
      correo: true,
      rol: true,
      activo: true,
    },
  },

  _count: {
    select: {
      cuentas: true,
      auditorias: true,
    },
  },
} satisfies Prisma.PppoePerfilHomologacionInclude;

type PerfilHomologacionReadRecord = Prisma.PppoePerfilHomologacionGetPayload<{
  include: typeof perfilHomologacionReadInclude;
}>;

@Injectable()
export class PerfilHomologacionPrismaRepository
  implements PerfilHomologacionRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: PerfilHomologacionEntity,
  ): Promise<PerfilHomologacionEntity> {
    const record = await this.prisma.pppoePerfilHomologacion.create({
      data: PerfilHomologacionPrismaMapper.toCreatePersistence(entity),
    });

    return PerfilHomologacionPrismaMapper.toDomain(record);
  }

  async update(
    entity: PerfilHomologacionEntity,
  ): Promise<PerfilHomologacionEntity> {
    const id = entity.id;

    if (id === null) {
      throw new Error(
        'No se puede actualizar una homologación sin identificador.',
      );
    }

    const record = await this.prisma.pppoePerfilHomologacion.update({
      where: {
        id,
      },

      data: PerfilHomologacionPrismaMapper.toUpdatePersistence(entity),
    });

    return PerfilHomologacionPrismaMapper.toDomain(record);
  }

  async findById(id: number): Promise<PerfilHomologacionEntity | null> {
    const record = await this.prisma.pppoePerfilHomologacion.findUnique({
      where: {
        id,
      },
    });

    return record ? PerfilHomologacionPrismaMapper.toDomain(record) : null;
  }

  async findByRouterAndService({
    mikrotikRouterId,
    servicioInternetId,
  }: BuscarPerfilPorRouterServicioParams): Promise<PerfilHomologacionEntity | null> {
    const record = await this.prisma.pppoePerfilHomologacion.findUnique({
      where: {
        mikrotikRouterId_servicioInternetId: {
          mikrotikRouterId,
          servicioInternetId,
        },
      },
    });

    return record ? PerfilHomologacionPrismaMapper.toDomain(record) : null;
  }

  async findActiveByRouterAndService({
    mikrotikRouterId,
    servicioInternetId,
  }: BuscarPerfilPorRouterServicioParams): Promise<PerfilHomologacionEntity | null> {
    const record = await this.prisma.pppoePerfilHomologacion.findFirst({
      where: {
        mikrotikRouterId,
        servicioInternetId,
        activo: true,
      },
    });

    return record ? PerfilHomologacionPrismaMapper.toDomain(record) : null;
  }

  async findByRouterAndCode({
    mikrotikRouterId,
    codigoPerfil,
  }: BuscarPerfilPorRouterCodigoParams): Promise<PerfilHomologacionEntity | null> {
    const record = await this.prisma.pppoePerfilHomologacion.findUnique({
      where: {
        mikrotikRouterId_codigoPerfil: {
          mikrotikRouterId,
          codigoPerfil,
        },
      },
    });

    return record ? PerfilHomologacionPrismaMapper.toDomain(record) : null;
  }

  async findDetailById(id: number): Promise<PerfilHomologacionDetalle | null> {
    const record = await this.prisma.pppoePerfilHomologacion.findUnique({
      where: {
        id,
      },

      include: perfilHomologacionReadInclude,
    });

    if (!record) {
      return null;
    }

    return this.mapReadModel(record);
  }

  async findMany(
    filters: PerfilHomologacionFindManyFilters,
  ): Promise<PerfilHomologacionPaginatedResult> {
    const page = Math.max(filters.page || 1, 1);

    const limit = Math.min(Math.max(filters.limit || 10, 1), 100);

    const skip = (page - 1) * limit;

    const where: Prisma.PppoePerfilHomologacionWhereInput = {};

    if (typeof filters.activo === 'boolean') {
      where.activo = filters.activo;
    }

    if (filters.mikrotikRouterId) {
      where.mikrotikRouterId = filters.mikrotikRouterId;
    }

    if (filters.servicioInternetId) {
      where.servicioInternetId = filters.servicioInternetId;
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim();

      where.OR = [
        {
          codigoPerfil: {
            contains: search,
            mode: 'insensitive',
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
                {
                  descripcion: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
        },

        {
          servicioInternet: {
            is: {
              OR: [
                {
                  nombre: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  velocidad: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
        },
      ];
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.pppoePerfilHomologacion.findMany({
        where,

        skip,
        take: limit,

        orderBy: [
          {
            activo: 'desc',
          },
          {
            actualizadoEn: 'desc',
          },
        ],

        include: perfilHomologacionReadInclude,
      }),

      this.prisma.pppoePerfilHomologacion.count({
        where,
      }),
    ]);

    return {
      items: records.map((record) => this.mapReadModel(record)),

      total,

      page,
      limit,

      totalPages: Math.ceil(total / limit),
    };
  }

  async findSeleccionables({
    // empresaId,
    search,
  }: PerfilHomologacionSeleccionableFilters): Promise<
    PerfilHomologacionSeleccionable[]
  > {
    const where: Prisma.PppoePerfilHomologacionWhereInput = {
      // empresaId,
      activo: true,
      mikrotikRouter: {
        is: {
          // empresaId,
          activo: true,
        },
      },
      servicioInternet: {
        is: {
          // empresaId,
          estado: 'ACTIVO',
        },
      },
    };

    if (search) {
      where.OR = [
        {
          codigoPerfil: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          mikrotikRouter: {
            is: {
              nombre: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          servicioInternet: {
            is: {
              nombre: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    return this.prisma.pppoePerfilHomologacion.findMany({
      where,
      orderBy: [
        {
          servicioInternet: {
            nombre: 'asc',
          },
        },
        {
          mikrotikRouter: {
            nombre: 'asc',
          },
        },
        {
          codigoPerfil: 'asc',
        },
      ],
      select: {
        id: true,
        codigoPerfil: true,
        mikrotikRouterId: true,
        servicioInternetId: true,
        mikrotikRouter: {
          select: {
            id: true,
            nombre: true,
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
    });
  }

  private mapReadModel(
    record: PerfilHomologacionReadRecord,
  ): PerfilHomologacionListItem {
    return {
      id: record.id,

      empresaId: record.empresaId,

      mikrotikRouterId: record.mikrotikRouterId,

      servicioInternetId: record.servicioInternetId,

      codigoPerfil: record.codigoPerfil,

      activo: record.activo,

      creadoPorId: record.creadoPorId,

      actualizadoPorId: record.actualizadoPorId,

      creadoEn: record.creadoEn,

      actualizadoEn: record.actualizadoEn,

      mikrotikRouter: {
        id: record.mikrotikRouter.id,

        nombre: record.mikrotikRouter.nombre,

        host: record.mikrotikRouter.host,

        sshPort: record.mikrotikRouter.sshPort,

        descripcion: record.mikrotikRouter.descripcion,

        activo: record.mikrotikRouter.activo,
      },

      servicioInternet: {
        id: record.servicioInternet.id,

        nombre: record.servicioInternet.nombre,

        velocidad: record.servicioInternet.velocidad,

        precio: record.servicioInternet.precio,

        estado: record.servicioInternet.estado,
      },

      creadoPor: record.creadoPor
        ? {
            id: record.creadoPor.id,

            nombre: record.creadoPor.nombre,

            correo: record.creadoPor.correo,

            rol: record.creadoPor.rol,

            activo: record.creadoPor.activo,
          }
        : null,

      actualizadoPor: record.actualizadoPor
        ? {
            id: record.actualizadoPor.id,

            nombre: record.actualizadoPor.nombre,

            correo: record.actualizadoPor.correo,

            rol: record.actualizadoPor.rol,

            activo: record.actualizadoPor.activo,
          }
        : null,

      conteos: {
        cuentas: record._count.cuentas,

        auditorias: record._count.auditorias,
      },
    };
  }
}
