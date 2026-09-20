import { ConflictException, Injectable, Logger } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';

import {
  ClienteDesInstalacionFindManyFilters,
  ClienteDesInstalacionPaginatedResult,
  ClienteDesInstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion.repository.port';

import {
  ClienteDesinstalacionAccesoResumen,
  ClienteDesinstalacionAuditoriaPppoeDetalle,
  ClienteDesinstalacionAutorizacionDetalle,
  ClienteDesinstalacionDetalle,
  ClienteDesinstalacionEquipoDetalle,
  ClienteDesinstalacionEvidenciaDetalle,
  ClienteDesinstalacionGastoDetalle,
  ClienteDesinstalacionListadoItem,
  ClienteDesinstalacionOperacionPppoeDetalle,
  ClienteDesinstalacionTecnicoDetalle,
  UsuarioDesinstalacionResumen,
} from '../../domain/read-models/cliente-desinstalacion.read-model';

import { ClienteDesinstalacionPrismaMapper } from './cliente-desinstalacion.prisma.mapper';

/**
 * ============================================================
 * SELECTS REUTILIZABLES
 * ============================================================
 */

const usuarioResumenSelect = {
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
} satisfies Prisma.UsuarioSelect;

const clienteResumenSelect = {
  id: true,

  nombre: true,

  apellidos: true,

  telefono: true,

  dpi: true,

  direccion: true,
} satisfies Prisma.ClienteInternetSelect;

const servicioResumenSelect = {
  id: true,

  nombre: true,

  velocidad: true,

  precio: true,
} satisfies Prisma.ServicioInternetSelect;

const ticketResumenSelect = {
  id: true,

  titulo: true,

  descripcion: true,

  estado: true,

  prioridad: true,

  fechaApertura: true,

  fechaCierre: true,
} satisfies Prisma.TicketSoporteSelect;

const cuentaPppoeResumenSelect = {
  id: true,

  usuario: true,

  estado: true,

  perfilHomologacionId: true,

  generadoEn: true,

  secretCreadoEn: true,

  activadoEn: true,

  suspendidoEn: true,

  eliminadoEn: true,

  ultimaSincronizacionEn: true,

  ultimoError: true,
} satisfies Prisma.ClientePppoeCuentaSelect;

const accesoInternetResumenSelect = {
  id: true,

  clienteId: true,

  servicioInternetId: true,

  tecnologia: true,

  metodoAutenticacion: true,

  estado: true,

  activadoEn: true,

  suspendidoEn: true,

  dadoDeBajaEn: true,

  creadoEn: true,

  actualizadoEn: true,

  cuentaPppoe: {
    select: cuentaPppoeResumenSelect,
  },
} satisfies Prisma.ClienteAccesoInternetSelect;

const autorizacionInclude = {
  solicitadoPor: {
    select: usuarioResumenSelect,
  },

  autorizadoPor: {
    select: usuarioResumenSelect,
  },
} satisfies Prisma.ClienteDesinstalacionAutorizacionInclude;

const operacionPppoeInclude = {
  iniciadoPor: {
    select: usuarioResumenSelect,
  },

  reautenticadoPor: {
    select: usuarioResumenSelect,
  },

  pasos: {
    orderBy: {
      orden: 'asc',
    },

    select: {
      id: true,

      tipo: true,

      orden: true,

      estado: true,

      errorCodigo: true,

      errorMensaje: true,

      iniciadoEn: true,

      finalizadoEn: true,

      duracionMs: true,
    },
  },
} satisfies Prisma.PppoeOperacionInclude;

/**
 * Relaciones resumidas para el listado paginado.
 */
const listadoInclude = {
  cliente: {
    select: clienteResumenSelect,
  },

  servicioInternet: {
    select: servicioResumenSelect,
  },

  ticket: {
    select: ticketResumenSelect,
  },

  solicitadoPor: {
    select: usuarioResumenSelect,
  },

  ejecutadoPor: {
    select: usuarioResumenSelect,
  },

  creadoPor: {
    select: usuarioResumenSelect,
  },

  accesoInternet: {
    select: accesoInternetResumenSelect,
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
        select: usuarioResumenSelect,
      },
    },
  },

  clienteDesinstalacionAutorizacions: {
    take: 1,

    orderBy: {
      fechaSolicitud: 'desc',
    },

    include: autorizacionInclude,
  },

  operacionesPppoe: {
    take: 1,

    orderBy: {
      creadoEn: 'desc',
    },

    include: operacionPppoeInclude,
  },

  _count: {
    select: {
      tecnicos: true,

      evidencias: true,

      equipos: true,

      gastosOperativos: true,

      clienteDesinstalacionAutorizacions: true,

      operacionesPppoe: true,

      auditoriasPppoe: true,
    },
  },
} satisfies Prisma.ClienteDesinstalacionInclude;

/**
 * Relaciones completas para el detalle.
 */
const detalleInclude = {
  cliente: {
    select: clienteResumenSelect,
  },

  servicioInternet: {
    select: servicioResumenSelect,
  },

  ticket: {
    select: ticketResumenSelect,
  },

  solicitadoPor: {
    select: usuarioResumenSelect,
  },

  ejecutadoPor: {
    select: usuarioResumenSelect,
  },

  creadoPor: {
    select: usuarioResumenSelect,
  },

  accesoInternet: {
    select: accesoInternetResumenSelect,
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
        select: usuarioResumenSelect,
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

          categoria: true,

          tipo: true,

          estado: true,

          cdnUrl: true,

          mimeType: true,

          extension: true,

          tamanioBytes: true,

          ancho: true,

          alto: true,

          titulo: true,

          descripcion: true,

          tomadoEn: true,

          creadoEn: true,
        },
      },
    },
  },

  equipos: {
    orderBy: {
      creadoEn: 'asc',
    },

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

      bodegaDestino: {
        select: {
          id: true,

          nombre: true,
        },
      },
    },
  },

  gastosOperativos: {
    orderBy: {
      fechaGasto: 'desc',
    },

    include: {
      registradoPor: {
        select: usuarioResumenSelect,
      },

      aprobadoPor: {
        select: usuarioResumenSelect,
      },

      evidenciaMedia: {
        select: {
          id: true,

          cdnUrl: true,

          mimeType: true,
        },
      },
    },
  },

  clienteDesinstalacionAutorizacions: {
    orderBy: {
      fechaSolicitud: 'desc',
    },

    include: autorizacionInclude,
  },

  operacionesPppoe: {
    orderBy: {
      creadoEn: 'desc',
    },

    include: operacionPppoeInclude,
  },

  auditoriasPppoe: {
    orderBy: {
      creadoEn: 'desc',
    },

    include: {
      operador: {
        select: usuarioResumenSelect,
      },
    },
  },

  _count: {
    select: {
      tecnicos: true,

      evidencias: true,

      equipos: true,

      gastosOperativos: true,

      clienteDesinstalacionAutorizacions: true,

      operacionesPppoe: true,

      auditoriasPppoe: true,
    },
  },
} satisfies Prisma.ClienteDesinstalacionInclude;

/**
 * ============================================================
 * PAYLOADS INFERIDOS POR PRISMA
 * ============================================================
 */

type UsuarioResumenRecord = Prisma.UsuarioGetPayload<{
  select: typeof usuarioResumenSelect;
}>;

type AccesoInternetResumenRecord = Prisma.ClienteAccesoInternetGetPayload<{
  select: typeof accesoInternetResumenSelect;
}>;

type AutorizacionRecord = Prisma.ClienteDesinstalacionAutorizacionGetPayload<{
  include: typeof autorizacionInclude;
}>;

type OperacionPppoeRecord = Prisma.PppoeOperacionGetPayload<{
  include: typeof operacionPppoeInclude;
}>;

type ListadoRecord = Prisma.ClienteDesinstalacionGetPayload<{
  include: typeof listadoInclude;
}>;

type DetalleRecord = Prisma.ClienteDesinstalacionGetPayload<{
  include: typeof detalleInclude;
}>;

/**
 * ============================================================
 * REPOSITORIO
 * ============================================================
 */

@Injectable()
export class ClienteDesInstalacionPrismaRepository
  implements ClienteDesInstalacionRepositoryPort
{
  private readonly logger = new Logger(
    ClienteDesInstalacionPrismaRepository.name,
  );
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ==========================================================
   * CREATE
   * ==========================================================
   */

  async create(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity> {
    try {
      const record = await this.prisma.clienteDesinstalacion.create({
        data: ClienteDesinstalacionPrismaMapper.toCreatePersistence(entity),
      });

      return ClienteDesinstalacionPrismaMapper.toDomain(record);
    } catch (error) {
      this.lanzarErrorDesinstalacionDuplicada(error);
    }
  }

  /**
   * ==========================================================
   * FIND SIMPLE
   * ==========================================================
   */

  async findById(id: number): Promise<ClienteDesinstalacionEntity | null> {
    const record = await this.prisma.clienteDesinstalacion.findUnique({
      where: {
        id,
      },
    });

    if (!record) {
      return null;
    }

    return ClienteDesinstalacionPrismaMapper.toDomain(record);
  }

  /**
   * ==========================================================
   * FIND DETAIL
   * ==========================================================
   */

  async findDetalleById(
    id: number,
  ): Promise<ClienteDesinstalacionDetalle | null> {
    const record = await this.prisma.clienteDesinstalacion.findUnique({
      where: {
        id,
      },

      include: detalleInclude,
    });

    if (!record) {
      return null;
    }

    return this.mapDetalleRecord(record);
  }

  /**
   * ==========================================================
   * FIND MANY
   * ==========================================================
   */

  async findMany(
    filters: ClienteDesInstalacionFindManyFilters,
  ): Promise<ClienteDesInstalacionPaginatedResult> {
    const page = Math.max(filters.page || 1, 1);

    const limit = Math.min(Math.max(filters.limit || 10, 1), 100);

    const skip = (page - 1) * limit;

    const where = this.buildWhere(filters);

    const [records, total] = await this.prisma.$transaction([
      this.prisma.clienteDesinstalacion.findMany({
        where,

        skip,

        take: limit,

        orderBy: {
          creadoEn: 'desc',
        },

        include: listadoInclude,
      }),

      this.prisma.clienteDesinstalacion.count({
        where,
      }),
    ]);

    return {
      data: records.map((record) => this.mapListadoRecord(record)),

      meta: {
        total,

        page,

        limit,

        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * ==========================================================
   * SAVE
   * ==========================================================
   */

  async save(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity> {
    try {
      const props = entity.toPrimitives();

      if (!props.id) {
        throw new Error('No se puede guardar una desinstalación sin id.');
      }

      const saved = await this.prisma.clienteDesinstalacion.update({
        where: {
          id: props.id,
        },

        data: ClienteDesinstalacionPrismaMapper.toUpdatePersistence(entity),
      });

      return ClienteDesinstalacionPrismaMapper.toDomain(saved);
    } catch (error) {
      this.lanzarErrorDesinstalacionDuplicada(error);
    }
  }

  /**
   * ==========================================================
   * MAPPERS DE READ MODEL
   * ==========================================================
   */

  private mapListadoRecord(
    record: ListadoRecord,
  ): ClienteDesinstalacionListadoItem {
    return this.mapListadoBase(record);
  }

  private mapDetalleRecord(
    record: DetalleRecord,
  ): ClienteDesinstalacionDetalle {
    const base = this.mapListadoBase(record);

    return {
      ...base,

      tecnicos: record.tecnicos.map((tecnico) => ({
        id: tecnico.id,

        desinstalacionId: tecnico.desinstalacionId,

        tecnicoId: tecnico.tecnicoId,

        rol: tecnico.rol,

        esResponsable: tecnico.esResponsable,

        tiempoMinutos: tecnico.tiempoMinutos,

        observaciones: tecnico.observaciones,

        tecnicoNombreSnapshot: tecnico.tecnicoNombreSnapshot,

        creadoEn: tecnico.creadoEn,

        actualizadoEn: tecnico.actualizadoEn,

        tecnico: this.mapUsuario(tecnico.tecnico),
      })),

      evidencias: record.evidencias.map((evidencia) =>
        this.mapEvidencia(evidencia),
      ),

      equipos: record.equipos.map((equipo) => this.mapEquipo(equipo)),

      gastosOperativos: record.gastosOperativos.map((gasto) =>
        this.mapGasto(gasto),
      ),

      autorizaciones: record.clienteDesinstalacionAutorizacions.map(
        (autorizacion) => this.mapAutorizacion(autorizacion),
      ),

      operacionesPppoe: record.operacionesPppoe.map((operacion) =>
        this.mapOperacionPppoe(operacion),
      ),

      auditoriasPppoe: record.auditoriasPppoe.map((auditoria) =>
        this.mapAuditoriaPppoe(auditoria),
      ),
    };
  }

  private mapListadoBase(
    record: ListadoRecord | DetalleRecord,
  ): ClienteDesinstalacionListadoItem {
    const tecnicoResponsable =
      record.tecnicos.find((tecnico) => tecnico.esResponsable) ?? null;

    const ultimaAutorizacion =
      record.clienteDesinstalacionAutorizacions[0] ?? null;

    const ultimaOperacionPppoe = record.operacionesPppoe[0] ?? null;

    return {
      desinstalacion: ClienteDesinstalacionPrismaMapper.toDomain(record),

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

      ticket: record.ticket
        ? {
            id: record.ticket.id,

            titulo: record.ticket.titulo,

            descripcion: record.ticket.descripcion,

            estado: record.ticket.estado,

            prioridad: record.ticket.prioridad,

            fechaApertura: record.ticket.fechaApertura,

            fechaCierre: record.ticket.fechaCierre,
          }
        : null,

      solicitadoPor: this.mapUsuario(record.solicitadoPor),

      ejecutadoPor: this.mapUsuario(record.ejecutadoPor),

      creadoPor: this.mapUsuario(record.creadoPor),

      accesoInternet: this.mapAccesoInternet(record.accesoInternet),

      tecnicoResponsable: tecnicoResponsable
        ? {
            asignacionId: tecnicoResponsable.id,

            tecnicoId: tecnicoResponsable.tecnicoId,

            nombre:
              tecnicoResponsable.tecnico?.nombre ??
              tecnicoResponsable.tecnicoNombreSnapshot ??
              'Técnico no identificado',

            avatarUrl: tecnicoResponsable.tecnico?.perfil?.avatarUrl ?? null,
          }
        : null,

      ultimaAutorizacion: ultimaAutorizacion
        ? this.mapAutorizacion(ultimaAutorizacion)
        : null,

      ultimaOperacionPppoe: ultimaOperacionPppoe
        ? this.mapOperacionPppoe(ultimaOperacionPppoe)
        : null,

      conteos: {
        tecnicos: record._count.tecnicos,

        evidencias: record._count.evidencias,

        equipos: record._count.equipos,

        gastosOperativos: record._count.gastosOperativos,

        autorizaciones: record._count.clienteDesinstalacionAutorizacions,

        operacionesPppoe: record._count.operacionesPppoe,

        auditoriasPppoe: record._count.auditoriasPppoe,
      },
    };
  }

  private mapUsuario(
    record: UsuarioResumenRecord | null,
  ): UsuarioDesinstalacionResumen | null {
    if (!record) {
      return null;
    }

    return {
      id: record.id,

      nombre: record.nombre,

      correo: record.correo,

      telefono: record.telefono,

      activo: record.activo,

      avatarUrl: record.perfil?.avatarUrl ?? null,
    };
  }

  private mapAccesoInternet(
    record: AccesoInternetResumenRecord | null,
  ): ClienteDesinstalacionAccesoResumen | null {
    if (!record) {
      return null;
    }

    return {
      id: record.id,

      clienteId: record.clienteId,

      servicioInternetId: record.servicioInternetId,

      tecnologia: record.tecnologia,

      metodoAutenticacion: record.metodoAutenticacion,

      estado: record.estado,

      activadoEn: record.activadoEn,

      suspendidoEn: record.suspendidoEn,

      dadoDeBajaEn: record.dadoDeBajaEn,

      creadoEn: record.creadoEn,

      actualizadoEn: record.actualizadoEn,

      cuentaPppoe: record.cuentaPppoe
        ? {
            id: record.cuentaPppoe.id,

            usuario: record.cuentaPppoe.usuario,

            estado: record.cuentaPppoe.estado,

            perfilHomologacionId: record.cuentaPppoe.perfilHomologacionId,

            generadoEn: record.cuentaPppoe.generadoEn,

            secretCreadoEn: record.cuentaPppoe.secretCreadoEn,

            activadoEn: record.cuentaPppoe.activadoEn,

            suspendidoEn: record.cuentaPppoe.suspendidoEn,

            eliminadoEn: record.cuentaPppoe.eliminadoEn,

            ultimaSincronizacionEn: record.cuentaPppoe.ultimaSincronizacionEn,

            ultimoError: record.cuentaPppoe.ultimoError,
          }
        : null,
    };
  }

  private mapAutorizacion(
    record: AutorizacionRecord,
  ): ClienteDesinstalacionAutorizacionDetalle {
    return {
      id: record.id,

      estado: record.estado,

      motivoSolicitud: record.motivoSolicitud,

      comentarioAutorizador: record.comentarioAutorizador,

      fechaSolicitud: record.fechaSolicitud,

      fechaRespuesta: record.fechaRespuesta,

      solicitadoPor: this.mapUsuario(record.solicitadoPor),

      autorizadoPor: this.mapUsuario(record.autorizadoPor),
    };
  }

  private mapOperacionPppoe(
    record: OperacionPppoeRecord,
  ): ClienteDesinstalacionOperacionPppoeDetalle {
    return {
      id: record.id,

      cuentaPppoeId: record.cuentaPppoeId,

      mikrotikRouterId: record.mikrotikRouterId,

      tipo: record.tipo,

      origen: record.origen,

      estado: record.estado,

      iniciadoPorId: record.iniciadoPorId,

      reautenticadoPorId: record.reautenticadoPorId,

      requiereReautenticacion: record.requiereReautenticacion,

      reautenticacionExitosa: record.reautenticacionExitosa,

      reautenticadoEn: record.reautenticadoEn,

      motivo: record.motivo,

      errorCodigo: record.errorCodigo,

      errorMensaje: record.errorMensaje,

      iniciadoEn: record.iniciadoEn,

      finalizadoEn: record.finalizadoEn,

      creadoEn: record.creadoEn,

      actualizadoEn: record.actualizadoEn,

      iniciadoPor: this.mapUsuario(record.iniciadoPor),

      reautenticadoPor: this.mapUsuario(record.reautenticadoPor),

      pasos: record.pasos.map((paso) => ({
        id: paso.id,

        tipo: paso.tipo,

        orden: paso.orden,

        estado: paso.estado,

        errorCodigo: paso.errorCodigo,

        errorMensaje: paso.errorMensaje,

        iniciadoEn: paso.iniciadoEn,

        finalizadoEn: paso.finalizadoEn,

        duracionMs: paso.duracionMs,
      })),
    };
  }

  private mapEvidencia(
    record: DetalleRecord['evidencias'][number],
  ): ClienteDesinstalacionEvidenciaDetalle {
    return {
      id: record.id,

      desinstalacionId: record.desinstalacionId,

      mediaId: record.mediaId,

      tipo: record.tipo,

      descripcion: record.descripcion,

      orden: record.orden,

      creadoEn: record.creadoEn,

      media: {
        id: record.media.id,

        categoria: record.media.categoria,

        tipo: record.media.tipo,

        estado: record.media.estado,

        cdnUrl: record.media.cdnUrl,

        mimeType: record.media.mimeType,

        extension: record.media.extension,

        tamanioBytes: record.media.tamanioBytes?.toString() ?? null,

        ancho: record.media.ancho,

        alto: record.media.alto,

        titulo: record.media.titulo,

        descripcion: record.media.descripcion,

        tomadoEn: record.media.tomadoEn,

        creadoEn: record.media.creadoEn,
      },
    };
  }

  private mapEquipo(
    record: DetalleRecord['equipos'][number],
  ): ClienteDesinstalacionEquipoDetalle {
    return {
      id: record.id,

      desinstalacionId: record.desinstalacionId,

      productoId: record.productoId,

      serialProductoId: record.serialProductoId,

      movimientoInventarioId: record.movimientoInventarioId,

      bodegaDestinoId: record.bodegaDestinoId,

      accesoEquipoId: record.accesoEquipoId,

      descripcion: record.descripcion,

      cantidad: record.cantidad.toNumber(),

      estadoRetiro: record.estadoRetiro,

      costoRecuperacion: record.costoRecuperacion.toNumber(),

      serialSnapshot: record.serialSnapshot,

      notas: record.notas,

      creadoEn: record.creadoEn,

      actualizadoEn: record.actualizadoEn,

      producto: record.producto
        ? {
            id: record.producto.id,

            nombre: record.producto.nombre,
          }
        : null,

      serialProducto: record.serialProducto
        ? {
            id: record.serialProducto.id,

            serial: record.serialProducto.serial,
          }
        : null,

      bodegaDestino: record.bodegaDestino
        ? {
            id: record.bodegaDestino.id,

            nombre: record.bodegaDestino.nombre,
          }
        : null,
    };
  }

  private mapGasto(
    record: DetalleRecord['gastosOperativos'][number],
  ): ClienteDesinstalacionGastoDetalle {
    return {
      id: record.id,

      tipoGasto: record.tipoGasto,

      subtipo: record.subtipo,

      descripcion: record.descripcion,

      montoTotal: record.montoTotal.toNumber(),

      esRecuperable: record.esRecuperable,

      estado: record.estado,

      fechaGasto: record.fechaGasto,

      aprobadoEn: record.aprobadoEn,

      registradoPor: this.mapUsuario(record.registradoPor),

      aprobadoPor: this.mapUsuario(record.aprobadoPor),

      evidencia: record.evidenciaMedia
        ? {
            id: record.evidenciaMedia.id,

            cdnUrl: record.evidenciaMedia.cdnUrl,

            mimeType: record.evidenciaMedia.mimeType,
          }
        : null,
    };
  }

  private mapAuditoriaPppoe(
    record: DetalleRecord['auditoriasPppoe'][number],
  ): ClienteDesinstalacionAuditoriaPppoeDetalle {
    return {
      id: record.id,

      operacionId: record.operacionId,

      cuentaPppoeId: record.cuentaPppoeId,

      accesoInternetId: record.accesoInternetId,

      perfilHomologacionId: record.perfilHomologacionId,

      operadorId: record.operadorId,

      origen: record.origen,

      accion: record.accion,

      descripcion: record.descripcion,

      estadoCuentaAnterior: record.estadoCuentaAnterior,

      estadoCuentaNuevo: record.estadoCuentaNuevo,

      usuarioPppoeSnapshot: record.usuarioPppoeSnapshot,

      perfilCodigoSnapshot: record.perfilCodigoSnapshot,

      datos: record.datos,

      ipOrigen: record.ipOrigen,

      userAgent: record.userAgent,

      creadoEn: record.creadoEn,

      operador: this.mapUsuario(record.operador),
    };
  }

  /**
   * ==========================================================
   * WHERE
   * ==========================================================
   */

  private buildWhere(
    filters: ClienteDesInstalacionFindManyFilters,
  ): Prisma.ClienteDesinstalacionWhereInput {
    const where: Prisma.ClienteDesinstalacionWhereInput = {};

    if (filters.empresaId) {
      where.empresaId = filters.empresaId;
    }

    if (filters.clienteId) {
      where.clienteId = filters.clienteId;
    }

    if (filters.servicioInternetId) {
      where.servicioInternetId = filters.servicioInternetId;
    }

    if (filters.ticketId) {
      where.ticketId = filters.ticketId;
    }

    if (filters.accesoInternetId) {
      where.accesoInternetId = filters.accesoInternetId;
    }

    if (filters.solicitadoPorId) {
      where.solicitadoPorId = filters.solicitadoPorId;
    }

    if (filters.ejecutadoPorId) {
      where.ejecutadoPorId = filters.ejecutadoPorId;
    }

    if (filters.creadoPorId) {
      where.creadoPorId = filters.creadoPorId;
    }

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters.motivo) {
      where.motivo = filters.motivo;
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
          direccionServicio: {
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
            dpi: {
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
      ];
    }

    return where;
  }

  private lanzarErrorDesinstalacionDuplicada(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target;

      const campos = Array.isArray(target)
        ? target.map(String)
        : [String(target ?? '')];

      if (campos.includes('accesoInternetId')) {
        throw new ConflictException(
          'El acceso de internet ya tiene una desinstalación activa.',
        );
      }
    }

    throw error;
  }
}
