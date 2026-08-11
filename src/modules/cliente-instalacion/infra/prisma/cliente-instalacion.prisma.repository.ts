import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';
import {
  ActualizarTecnicoInstalacionInput,
  BuscarInstalacionAsignadaTecnicoParams,
  ClienteInstalacionAssignedFilters,
  ClienteInstalacionAssignedPaginatedResult,
  ClienteInstalacionDetalle,
  ClienteInstalacionFindManyFilters,
  ClienteInstalacionPaginatedResult,
  ClienteInstalacionRepositoryPort,
  ClienteInstalacionTechnicalDetail,
  CrearTecnicoInstalacionInput,
} from '../../domain/ports/cliente-instalacion.repository.port';
import { ClienteInstalacionPrismaMapper } from './cliente-instalacion.prisma.mapper';
import { TipoEvidenciaClienteOperacion } from '../../domain/enums/tipo-evidencia-cliente-operacion.enum';
import { RolTecnicoOperacionCliente } from '../../domain/enums/rol-tecnico-operacion-cliente.enum';

@Injectable()
export class ClienteInstalacionPrismaRepository
  implements ClienteInstalacionRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: ClienteInstalacionEntity,
    tecnicos: CrearTecnicoInstalacionInput[] = [],
  ): Promise<ClienteInstalacionEntity> {
    const data = ClienteInstalacionPrismaMapper.toCreatePersistence(entity);

    const tecnicoIds = tecnicos.map((tecnico) => tecnico.tecnicoId);

    const usuarios =
      tecnicoIds.length > 0
        ? await this.prisma.usuario.findMany({
            where: {
              id: {
                in: tecnicoIds,
              },

              empresaId: entity.empresaId,

              activo: true,
            },

            select: {
              id: true,
              nombre: true,
            },
          })
        : [];

    if (usuarios.length !== tecnicoIds.length) {
      throw new Error(
        'Uno o más técnicos no existen, están inactivos o pertenecen a otra empresa.',
      );
    }

    const usuariosMap = new Map(
      usuarios.map((usuario) => [usuario.id, usuario]),
    );

    const record = await this.prisma.clienteInstalacion.create({
      data: {
        ...data,

        tecnicos:
          tecnicos.length > 0
            ? {
                create: tecnicos.map((tecnico) => ({
                  tecnicoId: tecnico.tecnicoId,

                  rol: tecnico.rol,

                  esResponsable: tecnico.esResponsable,

                  observaciones: tecnico.observaciones ?? null,

                  tecnicoNombreSnapshot:
                    usuariosMap.get(tecnico.tecnicoId)?.nombre ?? null,
                })),
              }
            : undefined,
      },
    });

    return ClienteInstalacionPrismaMapper.toDomain(record);
  }

  async findById(params: {
    id: number;
  }): Promise<ClienteInstalacionEntity | null> {
    const record = await this.prisma.clienteInstalacion.findFirst({
      where: {
        id: params.id,
      },
    });

    if (!record) return null;

    return ClienteInstalacionPrismaMapper.toDomain(record);
  }

  async findMany(
    filters: ClienteInstalacionFindManyFilters,
  ): Promise<ClienteInstalacionPaginatedResult> {
    const page = Math.max(filters.page || 1, 1);

    const limit = Math.min(Math.max(filters.limit || 10, 1), 100);

    const skip = (page - 1) * limit;

    const where: Prisma.ClienteInstalacionWhereInput = {
      empresaId: filters.empresaId,
    };

    if (filters.clienteId) {
      where.clienteId = filters.clienteId;
    }

    if (filters.servicioInternetId) {
      where.servicioInternetId = filters.servicioInternetId;
    }

    if (filters.ticketId) {
      where.ticketId = filters.ticketId;
    }

    if (filters.asesorId) {
      where.asesorId = filters.asesorId;
    }

    if (filters.creadoPorId) {
      where.creadoPorId = filters.creadoPorId;
    }

    if (filters.completadoPorId) {
      where.completadoPorId = filters.completadoPorId;
    }

    if (filters.tecnicoId) {
      where.tecnicos = {
        some: {
          tecnicoId: filters.tecnicoId,
        },
      };
    }

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters.fechaProgramadaDesde || filters.fechaProgramadaHasta) {
      where.fechaProgramada = {
        ...(filters.fechaProgramadaDesde
          ? {
              gte: filters.fechaProgramadaDesde,
            }
          : {}),

        ...(filters.fechaProgramadaHasta
          ? {
              lte: filters.fechaProgramadaHasta,
            }
          : {}),
      };
    }

    if (filters.fechaFinalizacionDesde || filters.fechaFinalizacionHasta) {
      where.fechaFinalizacion = {
        ...(filters.fechaFinalizacionDesde
          ? {
              gte: filters.fechaFinalizacionDesde,
            }
          : {}),

        ...(filters.fechaFinalizacionHasta
          ? {
              lte: filters.fechaFinalizacionHasta,
            }
          : {}),
      };
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim();

      where.OR = [
        {
          direccionInstalacion: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          referenciaUbicacion: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          observaciones: {
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
          resultado: {
            contains: search,
            mode: 'insensitive',
          },
        },

        // Buscar también por datos del cliente
        {
          cliente: {
            nombre: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },

        {
          cliente: {
            apellidos: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },

        {
          cliente: {
            telefono: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },

        {
          cliente: {
            dpi: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.clienteInstalacion.findMany({
        where,

        skip,
        take: limit,

        orderBy: {
          creadoEn: 'desc',
        },

        include: {
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

          servicioInternet: {
            select: {
              id: true,
              nombre: true,
              velocidad: true,
              precio: true,
            },
          },

          asesor: {
            select: {
              id: true,
              nombre: true,
              correo: true,
              telefono: true,
              activo: true,

              perfil: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },

          tecnicos: {
            where: {
              esResponsable: true,
            },

            take: 1,

            orderBy: {
              creadoEn: 'asc',
            },

            include: {
              tecnico: {
                select: {
                  id: true,
                  nombre: true,

                  perfil: {
                    select: {
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },

          _count: {
            select: {
              tecnicos: true,
              evidencias: true,
              equipos: true,
            },
          },
        },
      }),

      this.prisma.clienteInstalacion.count({
        where,
      }),
    ]);

    return {
      items: records.map((record) => {
        const responsable = record.tecnicos[0] ?? null;

        return {
          instalacion: ClienteInstalacionPrismaMapper.toDomain(record),

          cliente: {
            id: record.cliente.id,

            nombre: record.cliente.nombre,

            apellidos: record.cliente.apellidos,

            telefono: record.cliente.telefono,

            dpi: record.cliente.dpi,

            direccion: record.cliente.direccion,
          },

          servicioInternet: record.servicioInternet
            ? {
                id: record.servicioInternet.id,

                nombre: record.servicioInternet.nombre,

                velocidad: record.servicioInternet.velocidad,

                precio: record.servicioInternet.precio,
              }
            : null,

          asesor: record.asesor
            ? {
                id: record.asesor.id,
                nombre: record.asesor.nombre,
                correo: record.asesor.correo,
                telefono: record.asesor.telefono,
                activo: record.asesor.activo,
                avatarUrl: record.asesor.perfil?.avatarUrl ?? null,
              }
            : null,

          tecnicoResponsable: responsable
            ? {
                asignacionId: responsable.id,

                tecnicoId: responsable.tecnicoId,

                nombre:
                  responsable.tecnico?.nombre ??
                  responsable.tecnicoNombreSnapshot ??
                  'Técnico no disponible',

                avatarUrl: responsable.tecnico?.perfil?.avatarUrl ?? null,
              }
            : null,

          conteos: {
            tecnicos: record._count.tecnicos,

            evidencias: record._count.evidencias,

            equipos: record._count.equipos,
          },
        };
      }),

      total,

      page,

      limit,

      totalPages: Math.ceil(total / limit),
    };
  }

  async save(
    entity: ClienteInstalacionEntity,
    tecnicos?: ActualizarTecnicoInstalacionInput[],
  ): Promise<ClienteInstalacionEntity> {
    const props = entity.toPrimitives();

    if (!props.id) {
      throw new Error('No se puede guardar una instalación sin id.');
    }

    const data = ClienteInstalacionPrismaMapper.toUpdatePersistence(entity);

    /*
     * Si el PATCH no incluye técnicos, únicamente
     * actualizamos ClienteInstalacion.
     */
    if (tecnicos === undefined) {
      const record = await this.prisma.clienteInstalacion.update({
        where: {
          id: props.id,
        },

        data,
      });

      return ClienteInstalacionPrismaMapper.toDomain(record);
    }

    /*
     * El PATCH sí solicitó sincronizar técnicos.
     */
    const tecnicoIds = tecnicos.map((tecnico) => tecnico.tecnicoId);

    return this.prisma.$transaction(async (tx) => {
      /*
       * Validamos primero.
       *
       * Nunca eliminamos las asignaciones existentes
       * antes de saber que las nuevas son válidas.
       */
      const usuarios =
        tecnicoIds.length > 0
          ? await tx.usuario.findMany({
              where: {
                id: {
                  in: tecnicoIds,
                },

                empresaId: entity.empresaId,

                activo: true,
              },

              select: {
                id: true,
                nombre: true,
              },
            })
          : [];

      if (usuarios.length !== tecnicoIds.length) {
        throw new Error(
          'Uno o más técnicos no existen, están inactivos o pertenecen a otra empresa.',
        );
      }

      const usuariosMap = new Map(
        usuarios.map((usuario) => [usuario.id, usuario]),
      );

      /*
       * 1. Actualizamos la instalación.
       */
      const record = await tx.clienteInstalacion.update({
        where: {
          id: props.id,
        },

        data,
      });

      /*
       * 2. Eliminamos las asignaciones anteriores.
       *
       * Si tecnicos = [], la operación termina
       * aquí y la instalación queda sin técnicos.
       */
      await tx.clienteInstalacionTecnico.deleteMany({
        where: {
          instalacionId: props.id,
        },
      });

      /*
       * 3. Creamos el nuevo conjunto de asignaciones.
       */
      if (tecnicos.length > 0) {
        await tx.clienteInstalacionTecnico.createMany({
          data: tecnicos.map((tecnico) => ({
            instalacionId: props.id!,

            tecnicoId: tecnico.tecnicoId,

            rol: tecnico.rol,

            esResponsable: tecnico.esResponsable,

            tiempoMinutos: tecnico.tiempoMinutos ?? null,

            observaciones: tecnico.observaciones ?? null,

            tecnicoNombreSnapshot:
              usuariosMap.get(tecnico.tecnicoId)?.nombre ?? null,
          })),
        });
      }

      return ClienteInstalacionPrismaMapper.toDomain(record);
    });
  }

  async deleteAll(): Promise<any> {
    try {
      const records = await this.prisma.clienteInstalacion.deleteMany({});
      return records;
    } catch (error) {
      throw new Error();
    }
  }

  // DETALLES ClienteInstalacionListItem
  async findDetailById(params: {
    id: number;
  }): Promise<ClienteInstalacionDetalle | null> {
    const record = await this.prisma.clienteInstalacion.findUnique({
      where: {
        id: params.id,
      },

      include: {
        ticket: {
          select: {
            id: true,
            titulo: true,
            estado: true,
            prioridad: true,
            fechaApertura: true,
            fechaCierre: true,
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

        servicioInternet: {
          select: {
            id: true,
            nombre: true,
            velocidad: true,
            precio: true,
          },
        },

        asesor: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            telefono: true,
            activo: true,

            perfil: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },

        creadoPor: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            telefono: true,
            activo: true,

            perfil: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },

        completadoPor: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            telefono: true,
            activo: true,

            perfil: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },

        tecnicos: {
          include: {
            tecnico: {
              select: {
                id: true,
                nombre: true,
                correo: true,
                telefono: true,
                activo: true,

                perfil: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
          },

          orderBy: [
            {
              esResponsable: 'desc',
            },
            {
              creadoEn: 'asc',
            },
          ],
        },

        evidencias: {
          include: {
            media: {
              select: {
                id: true,
                cdnUrl: true,
                key: true,
                mimeType: true,
                extension: true,
                tamanioBytes: true,

                subidoPor: {
                  select: {
                    id: true,
                    nombre: true,
                    correo: true,
                    telefono: true,
                    activo: true,

                    perfil: {
                      select: {
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },

          orderBy: [
            {
              orden: 'asc',
            },
            {
              creadoEn: 'asc',
            },
          ],
        },

        _count: {
          select: {
            tecnicos: true,
            evidencias: true,
            equipos: true,
          },
        },
      },
    });

    if (!record) return null;

    const mapUsuario = (
      usuario: {
        id: number;
        nombre: string;
        correo: string;
        telefono: string | null;
        activo: boolean;
        perfil: {
          avatarUrl: string | null;
        } | null;
      } | null,
    ) => {
      if (!usuario) return null;

      return {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        telefono: usuario.telefono,
        activo: usuario.activo,
        avatarUrl: usuario.perfil?.avatarUrl ?? null,
      };
    };

    return {
      instalacion: ClienteInstalacionPrismaMapper.toDomain(record),

      cliente: {
        id: record.cliente.id,
        nombre: record.cliente.nombre,
        apellidos: record.cliente.apellidos,
        telefono: record.cliente.telefono,
        dpi: record.cliente.dpi,
        direccion: record.cliente.direccion,
      },

      servicioInternet: record.servicioInternet
        ? {
            id: record.servicioInternet.id,
            nombre: record.servicioInternet.nombre,
            velocidad: record.servicioInternet.velocidad,
            precio: record.servicioInternet.precio,
          }
        : null,

      participantes: {
        asesor: mapUsuario(record.asesor),
        creadoPor: mapUsuario(record.creadoPor),
        completadoPor: mapUsuario(record.completadoPor),
      },

      tecnicos: record.tecnicos.map((asignacion) => ({
        id: asignacion.id,
        instalacionId: asignacion.instalacionId,

        tecnicoId: asignacion.tecnicoId,

        rol: asignacion.rol as RolTecnicoOperacionCliente,

        esResponsable: asignacion.esResponsable,

        tiempoMinutos: asignacion.tiempoMinutos,
        observaciones: asignacion.observaciones,

        tecnicoNombreSnapshot: asignacion.tecnicoNombreSnapshot,

        creadoEn: asignacion.creadoEn,
        actualizadoEn: asignacion.actualizadoEn,

        tecnico: mapUsuario(asignacion.tecnico),
      })),

      evidencias: record.evidencias.map((evidencia) => ({
        id: evidencia.id,
        instalacionId: evidencia.instalacionId,

        mediaId: evidencia.mediaId,

        tipo: evidencia.tipo as TipoEvidenciaClienteOperacion,

        descripcion: evidencia.descripcion,
        orden: evidencia.orden,

        creadoEn: evidencia.creadoEn,

        media: {
          id: evidencia.media.id,
          cdnUrl: evidencia.media.cdnUrl,
          key: evidencia.media.key,
          mimeType: evidencia.media.mimeType,
          extension: evidencia.media.extension,
          tamanioBytes: evidencia.media.tamanioBytes,

          subidoPor: mapUsuario(evidencia.media.subidoPor),
        },
      })),

      conteos: {
        tecnicos: record._count.tecnicos,
        evidencias: record._count.evidencias,
        equipos: record._count.equipos,
      },

      ticket: record.ticket
        ? {
            id: record.ticket.id,
            titulo: record.ticket.titulo,
            estado: record.ticket.estado,
            prioridad: record.ticket.prioridad,
            fechaApertura: record.ticket.fechaApertura,
            fechaCierre: record.ticket.fechaCierre,
          }
        : null,
    };
  }

  // ASIGNADOS
  async findAssignedToTechnician(
    filters: ClienteInstalacionAssignedFilters,
  ): Promise<ClienteInstalacionAssignedPaginatedResult> {
    const page = Math.max(filters.page || 1, 1);

    const limit = Math.min(Math.max(filters.limit || 10, 1), 100);

    const skip = (page - 1) * limit;

    const where: Prisma.ClienteInstalacionWhereInput = {
      tecnicos: {
        some: {
          tecnicoId: filters.tecnicoId,
        },
      },
    };

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.fechaProgramadaDesde || filters.fechaProgramadaHasta) {
      where.fechaProgramada = {
        ...(filters.fechaProgramadaDesde
          ? {
              gte: filters.fechaProgramadaDesde,
            }
          : {}),

        ...(filters.fechaProgramadaHasta
          ? {
              lte: filters.fechaProgramadaHasta,
            }
          : {}),
      };
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim();

      where.OR = [
        {
          direccionInstalacion: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          referenciaUbicacion: {
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

        {
          observaciones: {
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
          resultado: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          cliente: {
            nombre: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },

        {
          cliente: {
            apellidos: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },

        {
          cliente: {
            telefono: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },

        {
          cliente: {
            dpi: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.clienteInstalacion.findMany({
        where,

        skip,
        take: limit,

        orderBy: [
          {
            creadoEn: 'desc',
          },
        ],

        include: {
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

          servicioInternet: {
            select: {
              id: true,
              nombre: true,
              velocidad: true,
              precio: true,
            },
          },

          asesor: {
            select: {
              id: true,
              nombre: true,
              correo: true,
              telefono: true,
              activo: true,

              perfil: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },

          /*
           * Solo necesitamos:
           *
           * 1. La asignación del técnico autenticado.
           * 2. La asignación marcada como responsable.
           *
           * Los conteos totales se obtienen mediante _count.
           */
          tecnicos: {
            where: {
              OR: [
                {
                  tecnicoId: filters.tecnicoId,
                },
                {
                  esResponsable: true,
                },
              ],
            },

            orderBy: [
              {
                esResponsable: 'desc',
              },
              {
                creadoEn: 'asc',
              },
            ],

            include: {
              tecnico: {
                select: {
                  id: true,
                  nombre: true,

                  perfil: {
                    select: {
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },

          _count: {
            select: {
              tecnicos: true,
              evidencias: true,
              equipos: true,
            },
          },
        },
      }),

      this.prisma.clienteInstalacion.count({
        where,
      }),
    ]);

    return {
      items: records.map((record) => {
        const miAsignacion = record.tecnicos.find(
          (asignacion) => asignacion.tecnicoId === filters.tecnicoId,
        );

        /*
         * El filtro principal garantiza que existe una asignación
         * para este técnico. Esta validación protege el contrato
         * si los datos cambian entre la consulta y el mapeo.
         */
        if (!miAsignacion) {
          throw new Error(
            `No se encontró la asignación del técnico ${filters.tecnicoId} en la instalación ${record.id}.`,
          );
        }

        const responsable =
          record.tecnicos.find((asignacion) => asignacion.esResponsable) ??
          null;

        return {
          instalacion: ClienteInstalacionPrismaMapper.toDomain(record),

          cliente: {
            id: record.cliente.id,

            nombre: record.cliente.nombre,

            apellidos: record.cliente.apellidos,

            telefono: record.cliente.telefono,

            dpi: record.cliente.dpi,

            direccion: record.cliente.direccion,
          },

          servicioInternet: record.servicioInternet
            ? {
                id: record.servicioInternet.id,

                nombre: record.servicioInternet.nombre,

                velocidad: record.servicioInternet.velocidad,

                precio: record.servicioInternet.precio,
              }
            : null,

          asesor: record.asesor
            ? {
                id: record.asesor.id,

                nombre: record.asesor.nombre,

                correo: record.asesor.correo,

                telefono: record.asesor.telefono,

                activo: record.asesor.activo,

                avatarUrl: record.asesor.perfil?.avatarUrl ?? null,
              }
            : null,

          miAsignacion: {
            asignacionId: miAsignacion.id,

            tecnicoId: miAsignacion.tecnicoId,

            rol: miAsignacion.rol,

            esResponsable: miAsignacion.esResponsable,
          },

          tecnicoResponsable: responsable
            ? {
                asignacionId: responsable.id,

                tecnicoId: responsable.tecnicoId,

                nombre:
                  responsable.tecnico?.nombre ??
                  responsable.tecnicoNombreSnapshot ??
                  'Técnico no disponible',

                avatarUrl: responsable.tecnico?.perfil?.avatarUrl ?? null,
              }
            : null,

          conteos: {
            tecnicos: record._count.tecnicos,

            evidencias: record._count.evidencias,

            equipos: record._count.equipos,
          },
        };
      }),

      total,

      page,

      limit,

      totalPages: Math.ceil(total / limit),
    };
  }

  async findTechnicalDetailById(
    instalacionId: number,
    actorId: number,
  ): Promise<ClienteInstalacionTechnicalDetail | null> {
    const record = await this.prisma.clienteInstalacion.findUnique({
      where: {
        id: instalacionId,
      },

      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            telefono: true,
            dpi: true,
            direccion: true,
            contactoReferenciaTelefono: true,
            observaciones: true,

            municipio: {
              select: {
                nombre: true,
              },
            },
            departamento: {
              select: {
                nombre: true,
              },
            },
            sector: {
              select: {
                nombre: true,
              },
            },
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

        tecnicos: {
          orderBy: [
            {
              esResponsable: 'desc',
            },
            {
              creadoEn: 'asc',
            },
          ],

          include: {
            tecnico: {
              select: {
                id: true,
                nombre: true,

                perfil: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },

        clienteInstalacionAccesos: {
          orderBy: {
            creadoEn: 'asc',
          },

          include: {
            accesoInternet: {
              include: {
                configuracionTecnica: true,

                cuentaPppoe: {
                  include: {
                    perfilHomologacion: {
                      include: {
                        mikrotikRouter: {
                          select: {
                            id: true,
                            nombre: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        evidencias: {
          orderBy: [
            {
              orden: 'asc',
            },
            {
              creadoEn: 'asc',
            },
          ],

          include: {
            media: {
              select: {
                id: true,
                cdnUrl: true,
                mimeType: true,
                titulo: true,
              },
            },
          },
        },

        equipos: {
          orderBy: [
            {
              esPrincipal: 'desc',
            },
            {
              creadoEn: 'asc',
            },
          ],

          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
              },
            },

            serialProducto: {
              select: {
                id: true,
                serial: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      return null;
    }

    /*
     * Es únicamente contexto para la pantalla.
     * No determina si el actor puede consultar u operar.
     */
    const miAsignacion =
      record.tecnicos.find((asignacion) => asignacion.tecnicoId === actorId) ??
      null;

    return {
      instalacion: ClienteInstalacionPrismaMapper.toDomain(record),

      cliente: {
        id: record.cliente.id,

        nombre: record.cliente.nombre,

        apellidos: record.cliente.apellidos,

        telefono: record.cliente.telefono,

        telefonoReferencia: record.cliente.contactoReferenciaTelefono,

        dpi: record.cliente.dpi,

        direccion: record.cliente.direccion,

        observaciones: record.cliente.observaciones,

        municipio: record.cliente.municipio.nombre,
        departamento: record.cliente.departamento.nombre,

        sector: record.cliente.sector.nombre,
      },

      servicioInternet: record.servicioInternet
        ? {
            id: record.servicioInternet.id,

            nombre: record.servicioInternet.nombre,

            velocidad: record.servicioInternet.velocidad,

            precio: record.servicioInternet.precio,
          }
        : null,

      miAsignacion: miAsignacion
        ? {
            asignacionId: miAsignacion.id,

            tecnicoId: miAsignacion.tecnicoId,

            rol: miAsignacion.rol,

            esResponsable: miAsignacion.esResponsable,
          }
        : null,

      participantes: record.tecnicos.map((asignacion) => ({
        asignacionId: asignacion.id,

        tecnicoId: asignacion.tecnicoId,

        nombre:
          asignacion.tecnico?.nombre ??
          asignacion.tecnicoNombreSnapshot ??
          'Técnico no disponible',

        avatarUrl: asignacion.tecnico?.perfil?.avatarUrl ?? null,

        rol: asignacion.rol,

        esResponsable: asignacion.esResponsable,

        tiempoMinutos: asignacion.tiempoMinutos,

        observaciones: asignacion.observaciones,
      })),

      accesos: record.clienteInstalacionAccesos.map((vinculo) => {
        const acceso = vinculo.accesoInternet;

        const configuracion = acceso.configuracionTecnica;

        const cuentaPppoe = acceso.cuentaPppoe;

        return {
          vinculoId: vinculo.id,

          accion: vinculo.accion,

          accesoInternetId: acceso.id,

          tecnologia: acceso.tecnologia,

          metodoAutenticacion: acceso.metodoAutenticacion,

          estado: acceso.estado,

          servicioInternetId: acceso.servicioInternetId,

          configuracionTecnica: configuracion
            ? {
                id: configuracion.id,

                potenciaOpticaRxDbm:
                  configuracion.potenciaOpticaRxDbm !== null
                    ? Number(configuracion.potenciaOpticaRxDbm)
                    : null,

                senalInalambricaDbm:
                  configuracion.senalInalambricaDbm !== null
                    ? Number(configuracion.senalInalambricaDbm)
                    : null,

                ssid: configuracion.ssid,

                /*
                 * Solo informa si existe.
                 * Nunca devuelve el valor protegido.
                 */
                tieneContrasenaWifi: Boolean(
                  configuracion.contrasenaWifiProtegida,
                ),

                bandaWifi: configuracion.bandaWifi,

                canal: configuracion.canal,

                anchoCanalMhz: configuracion.anchoCanalMhz,

                ipv4: configuracion.ipv4,

                ipv6: configuracion.ipv6,

                gateway: configuracion.gateway,

                dnsPrimario: configuracion.dnsPrimario,

                dnsSecundario: configuracion.dnsSecundario,

                observaciones: configuracion.observaciones,
              }
            : null,

          cuentaPppoe: cuentaPppoe
            ? {
                id: cuentaPppoe.id,

                usuario: cuentaPppoe.usuario,

                /*
                 * No se mapean:
                 *
                 * secretoCifrado
                 * secretoIv
                 * secretoAuthTag
                 */
                estado: cuentaPppoe.estado,

                perfilHomologacionId: cuentaPppoe.perfilHomologacionId,

                codigoPerfil: cuentaPppoe.perfilHomologacion.codigoPerfil,

                mikrotikRouterId:
                  cuentaPppoe.perfilHomologacion.mikrotikRouter.id,

                routerNombre:
                  cuentaPppoe.perfilHomologacion.mikrotikRouter.nombre,

                generadoEn: cuentaPppoe.generadoEn,

                activadoEn: cuentaPppoe.activadoEn,

                ultimaSincronizacionEn: cuentaPppoe.ultimaSincronizacionEn,

                ultimoError: cuentaPppoe.ultimoError,
              }
            : null,
        };
      }),

      evidencias: record.evidencias.map((evidencia) => ({
        evidenciaId: evidencia.id,

        mediaId: evidencia.mediaId,

        tipo: evidencia.tipo,

        descripcion: evidencia.descripcion,

        orden: evidencia.orden,

        url: evidencia.media.cdnUrl,

        mimeType: evidencia.media.mimeType,

        titulo: evidencia.media.titulo,

        creadoEn: evidencia.creadoEn,
      })),

      equipos: record.equipos.map((equipo) => ({
        id: equipo.id,

        productoId: equipo.productoId,

        productoNombre: equipo.producto?.nombre ?? null,

        serialProductoId: equipo.serialProductoId,

        /*
         * Si el registro serial fue desvinculado,
         * conservamos el snapshot.
         */
        serial: equipo.serialProducto?.serial ?? equipo.serialSnapshot ?? null,

        descripcion: equipo.descripcion,

        cantidad: Number(equipo.cantidad),

        esPrincipal: equipo.esPrincipal,

        notas: equipo.notas,
      })),
    };
  }

  async findByIdAssignedToTechnician(
    params: BuscarInstalacionAsignadaTecnicoParams,
  ): Promise<ClienteInstalacionEntity | null> {
    const instalacion = await this.prisma.clienteInstalacion.findFirst({
      where: {
        id: params.instalacionId,

        empresaId: params.empresaId,

        tecnicos: {
          some: {
            tecnicoId: params.tecnicoId,
          },
        },
      },
    });

    if (!instalacion) {
      return null;
    }

    return ClienteInstalacionPrismaMapper.toDomain(instalacion);
  }
}
