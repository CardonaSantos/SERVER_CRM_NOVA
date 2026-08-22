import { Injectable } from '@nestjs/common';

import {
  EstadoTrackingTecnico as PrismaEstadoTrackingTecnico,
  Prisma,
} from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  calculateAttendanceMinutes,
  calculateConfirmedTrackingMinutes,
  calculateMinutesWithoutTracking,
  calculateTotalConfirmedTrackingMinutes,
} from '../../application/helpers/tracking-metrics.helper';

import {
  TecnicoTrackingAsistenciaDetalle,
  TecnicoTrackingHistorialFilters,
  TecnicoTrackingHistorialPaginatedResult,
  TecnicoTrackingRealtimeView,
  TecnicoTrackingTecnicoResumen,
  TecnicoTrackingUbicacionesFilters,
  TecnicoTrackingUbicacionesPaginatedResult,
} from '../../domain/ports/tecnico-tracking-query.port';
import { TecnicoTrackingQueryPort } from '../../domain/ports/TecnicoTrackingQueryPort.port';
import { TecnicoTrackingSesionPrismaMapper } from './common/tecnico-tracking-sesion.prisma.mapper';

@Injectable()
export class TecnicoTrackingPrismaQuery implements TecnicoTrackingQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  // =====================================================
  // HISTORICO PAGINADO
  // =====================================================

  async findAttendanceHistory(
    filters: TecnicoTrackingHistorialFilters,
  ): Promise<TecnicoTrackingHistorialPaginatedResult> {
    const page = Math.max(filters.page || 1, 1);

    const limit = Math.min(Math.max(filters.limit || 10, 1), 100);

    const skip = (page - 1) * limit;

    const where: Prisma.AsistenciaWhereInput = {
      /*
       * IMPORTANTE:
       *
       * Este endpoint no representa cualquier
       * asistencia existente en el sistema.
       *
       * Representa jornadas relacionadas con tracking.
       */
      sesionesTracking: {
        some: filters.estadoSesion
          ? {
              estado: TecnicoTrackingSesionPrismaMapper.toPrismaEstado(
                filters.estadoSesion,
              ),
            }
          : {},
      },
    };

    // ---------------------------------------------------
    // TECNICO
    // ---------------------------------------------------

    if (filters.tecnicoId) {
      where.usuarioId = filters.tecnicoId;
    }

    // ---------------------------------------------------
    // FECHA DE JORNADA
    // ---------------------------------------------------

    if (filters.fechaDesde || filters.fechaHasta) {
      where.fecha = {
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

    // ---------------------------------------------------
    // BUSQUEDA
    // ---------------------------------------------------

    if (filters.search?.trim()) {
      const search = filters.search.trim();

      where.usuario = {
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

            {
              telefono: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
      };
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.asistencia.findMany({
        where,

        skip,
        take: limit,

        /*
         * Orden estable.
         *
         * Primero el día más reciente y luego
         * la entrada más reciente dentro de ese día.
         */
        orderBy: [
          {
            fecha: 'desc',
          },
          {
            horaEntrada: 'desc',
          },
          {
            id: 'desc',
          },
        ],

        select: {
          id: true,

          fecha: true,

          horaEntrada: true,
          horaSalida: true,

          minutosTarde: true,

          trabajoCompleto: true,

          usuario: {
            select: {
              id: true,

              nombre: true,

              correo: true,

              telefono: true,

              rol: true,

              activo: true,

              perfil: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },

          /*
           * No filtramos estas sesiones por estado,
           * aunque estadoSesion haya sido utilizado
           * para filtrar la asistencia.
           *
           * Necesitamos TODAS las sesiones del día
           * para calcular correctamente el resumen.
           */
          sesionesTracking: {
            select: {
              id: true,

              estado: true,

              iniciadoEn: true,

              finalizadoEn: true,

              ultimoHeartbeatEn: true,
            },

            orderBy: {
              iniciadoEn: 'asc',
            },
          },
        },
      }),

      this.prisma.asistencia.count({
        where,
      }),
    ]);

    const items = records.map((record) => {
      const sessions = record.sesionesTracking.map((session) => ({
        estado: TecnicoTrackingSesionPrismaMapper.toDomainEstado(
          session.estado,
        ),

        iniciadoEn: session.iniciadoEn,

        finalizadoEn: session.finalizadoEn,

        ultimoHeartbeatEn: session.ultimoHeartbeatEn,
      }));

      const sesionesFinalizadas = record.sesionesTracking.filter(
        (session) => session.estado === PrismaEstadoTrackingTecnico.FINALIZADA,
      ).length;

      const sesionesExpiradas = record.sesionesTracking.filter(
        (session) => session.estado === PrismaEstadoTrackingTecnico.EXPIRADA,
      ).length;

      const haySesionActiva = record.sesionesTracking.some(
        (session) => session.estado === PrismaEstadoTrackingTecnico.ACTIVA,
      );

      const primeraActivacion = record.sesionesTracking[0]?.iniciadoEn ?? null;

      const sesionesFinalizadasConFecha = record.sesionesTracking.filter(
        (
          session,
        ): session is typeof session & {
          finalizadoEn: Date;
        } => session.finalizadoEn !== null,
      );

      const ultimaFinalizacion =
        sesionesFinalizadasConFecha.length > 0
          ? sesionesFinalizadasConFecha.reduce(
              (latest, session) =>
                session.finalizadoEn.getTime() > latest.getTime()
                  ? session.finalizadoEn
                  : latest,
              sesionesFinalizadasConFecha[0].finalizadoEn,
            )
          : null;

      const ultimoHeartbeatEn =
        record.sesionesTracking.length > 0
          ? record.sesionesTracking.reduce(
              (latest, session) =>
                session.ultimoHeartbeatEn.getTime() > latest.getTime()
                  ? session.ultimoHeartbeatEn
                  : latest,
              record.sesionesTracking[0].ultimoHeartbeatEn,
            )
          : null;

      const minutosTracking = calculateTotalConfirmedTrackingMinutes(sessions);

      return {
        asistenciaId: record.id,

        fecha: record.fecha,

        horaEntrada: record.horaEntrada,

        horaSalida: record.horaSalida,

        tecnico: this.mapTechnicianSummary(record.usuario),

        asistencia: {
          minutosTarde: record.minutosTarde,

          trabajoCompleto: record.trabajoCompleto,
        },

        tracking: {
          sesionesTotal: record.sesionesTracking.length,

          sesionesFinalizadas,

          sesionesExpiradas,

          haySesionActiva,

          primeraActivacion,

          ultimaFinalizacion,

          ultimoHeartbeatEn,

          minutosTracking,
        },
      };
    });

    return {
      items,

      total,

      page,

      limit,

      totalPages: Math.ceil(total / limit),
    };
  }

  // =====================================================
  // DETALLE DE ASISTENCIA
  // =====================================================

  async findAttendanceDetail(params: {
    asistenciaId: number;
  }): Promise<TecnicoTrackingAsistenciaDetalle | null> {
    const record = await this.prisma.asistencia.findUnique({
      where: {
        id: params.asistenciaId,
      },

      select: {
        id: true,

        fecha: true,

        horaEntrada: true,
        horaSalida: true,

        minutosTarde: true,

        trabajoCompleto: true,

        usuario: {
          select: {
            id: true,

            nombre: true,

            correo: true,

            telefono: true,

            rol: true,

            activo: true,

            perfil: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },

        sesionesTracking: {
          select: {
            id: true,

            estado: true,

            iniciadoEn: true,

            finalizadoEn: true,

            ultimoHeartbeatEn: true,

            _count: {
              select: {
                ubicaciones: true,
              },
            },
          },

          orderBy: {
            iniciadoEn: 'asc',
          },
        },
      },
    });

    if (!record) {
      return null;
    }

    /*
     * Una asistencia sin sesiones de tracking
     * pertenece al sistema antiguo u otro flujo.
     *
     * No debe presentarse como detalle de tracking.
     */
    if (record.sesionesTracking.length === 0) {
      return null;
    }

    /*
     * Consultamos primera y última coordenada
     * por sesión.
     *
     * El número de sesiones por jornada es pequeño;
     * no cargamos todo el recorrido GPS.
     */
    const sessionDetails = await Promise.all(
      record.sesionesTracking.map(async (session) => {
        const [primera, ultima] = await Promise.all([
          this.prisma.ubicacionTecnico.findFirst({
            where: {
              sesionTrackingId: session.id,
            },

            orderBy: [
              {
                capturadoEn: 'asc',
              },
              {
                id: 'asc',
              },
            ],

            select: {
              latitud: true,
              longitud: true,

              bateria: true,

              capturadoEn: true,
            },
          }),

          this.prisma.ubicacionTecnico.findFirst({
            where: {
              sesionTrackingId: session.id,
            },

            orderBy: [
              {
                capturadoEn: 'desc',
              },
              {
                id: 'desc',
              },
            ],

            select: {
              latitud: true,
              longitud: true,

              bateria: true,

              capturadoEn: true,
            },
          }),
        ]);

        const estado = TecnicoTrackingSesionPrismaMapper.toDomainEstado(
          session.estado,
        );

        const duracionMinutos = calculateConfirmedTrackingMinutes({
          estado,

          iniciadoEn: session.iniciadoEn,

          finalizadoEn: session.finalizadoEn,

          ultimoHeartbeatEn: session.ultimoHeartbeatEn,
        });

        return {
          id: session.id,

          estado,

          iniciadoEn: session.iniciadoEn,

          finalizadoEn: session.finalizadoEn,

          ultimoHeartbeatEn: session.ultimoHeartbeatEn,

          duracionMinutos,

          puntosRegistrados: session._count.ubicaciones,

          bateriaInicial: primera?.bateria ?? null,

          bateriaFinal: ultima?.bateria ?? null,

          primeraUbicacion: primera
            ? {
                latitud: primera.latitud,

                longitud: primera.longitud,

                capturadoEn: primera.capturadoEn,
              }
            : null,

          ultimaUbicacion: ultima
            ? {
                latitud: ultima.latitud,

                longitud: ultima.longitud,

                capturadoEn: ultima.capturadoEn,
              }
            : null,
        };
      }),
    );

    const metricSessions = record.sesionesTracking.map((session) => ({
      estado: TecnicoTrackingSesionPrismaMapper.toDomainEstado(session.estado),

      iniciadoEn: session.iniciadoEn,

      finalizadoEn: session.finalizadoEn,

      ultimoHeartbeatEn: session.ultimoHeartbeatEn,
    }));

    const minutosTracking =
      calculateTotalConfirmedTrackingMinutes(metricSessions);

    const minutosJornada = calculateAttendanceMinutes({
      horaEntrada: record.horaEntrada,

      horaSalida: record.horaSalida,
    });

    const minutosSinTracking = calculateMinutesWithoutTracking({
      minutosJornada,

      minutosTracking,
    });

    const sesionesFinalizadas = record.sesionesTracking.filter(
      (session) => session.estado === PrismaEstadoTrackingTecnico.FINALIZADA,
    ).length;

    const sesionesExpiradas = record.sesionesTracking.filter(
      (session) => session.estado === PrismaEstadoTrackingTecnico.EXPIRADA,
    ).length;

    const haySesionActiva = record.sesionesTracking.some(
      (session) => session.estado === PrismaEstadoTrackingTecnico.ACTIVA,
    );

    const primeraActivacion = record.sesionesTracking[0]?.iniciadoEn ?? null;

    const finalizadas = record.sesionesTracking.filter(
      (
        session,
      ): session is typeof session & {
        finalizadoEn: Date;
      } => session.finalizadoEn !== null,
    );

    const ultimaFinalizacion =
      finalizadas.length > 0
        ? finalizadas.reduce(
            (latest, session) =>
              session.finalizadoEn.getTime() > latest.getTime()
                ? session.finalizadoEn
                : latest,
            finalizadas[0].finalizadoEn,
          )
        : null;

    const ultimoHeartbeatEn = record.sesionesTracking.reduce(
      (latest, session) =>
        session.ultimoHeartbeatEn.getTime() > latest.getTime()
          ? session.ultimoHeartbeatEn
          : latest,
      record.sesionesTracking[0].ultimoHeartbeatEn,
    );

    return {
      asistencia: {
        id: record.id,

        fecha: record.fecha,

        horaEntrada: record.horaEntrada,

        horaSalida: record.horaSalida,

        minutosTarde: record.minutosTarde,

        trabajoCompleto: record.trabajoCompleto,
      },

      tecnico: this.mapTechnicianSummary(record.usuario),

      resumen: {
        sesionesTotal: record.sesionesTracking.length,

        sesionesFinalizadas,

        sesionesExpiradas,

        haySesionActiva,

        primeraActivacion,

        ultimaFinalizacion,

        ultimoHeartbeatEn,

        minutosTracking,

        minutosJornada,

        minutosSinTracking,
      },

      sesiones: sessionDetails,
    };
  }

  // =====================================================
  // RECORRIDO GPS PAGINADO
  // =====================================================

  async findAttendanceLocations(
    filters: TecnicoTrackingUbicacionesFilters,
  ): Promise<TecnicoTrackingUbicacionesPaginatedResult> {
    const page = Math.max(filters.page || 1, 1);

    const limit = Math.min(Math.max(filters.limit || 250, 1), 1000);

    const skip = (page - 1) * limit;

    /*
     * La relación con la asistencia se valida
     * mediante la propia sesión.
     *
     * No basta con confiar en sesionTrackingId.
     */
    const where: Prisma.UbicacionTecnicoWhereInput = {
      sesionTracking: {
        is: {
          asistenciaId: filters.asistenciaId,

          ...(filters.sesionTrackingId
            ? {
                id: filters.sesionTrackingId,
              }
            : {}),
        },
      },
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.ubicacionTecnico.findMany({
        where,

        skip,
        take: limit,

        /*
         * Para reconstrucción del recorrido,
         * el orden relevante es CAPTURA, no
         * momento de recepción del backend.
         */
        orderBy: [
          {
            capturadoEn: 'asc',
          },
          {
            id: 'asc',
          },
        ],

        select: {
          id: true,

          sesionTrackingId: true,

          latitud: true,
          longitud: true,

          precision: true,
          velocidad: true,

          bateria: true,

          capturadoEn: true,

          creadoEn: true,
        },
      }),

      this.prisma.ubicacionTecnico.count({
        where,
      }),
    ]);

    return {
      items: records.map((record) => ({
        id: record.id,

        sesionTrackingId: record.sesionTrackingId,

        latitud: record.latitud,

        longitud: record.longitud,

        precision: record.precision,

        velocidad: record.velocidad,

        bateria: record.bateria,

        capturadoEn: record.capturadoEn,

        recibidoEn: record.creadoEn,
      })),

      total,

      page,

      limit,

      totalPages: Math.ceil(total / limit),
    };
  }

  // =====================================================
  // VISTA REALTIME ENRIQUECIDA
  // =====================================================

  async findRealtimeViewByTechnician(
    tecnicoId: number,
  ): Promise<TecnicoTrackingRealtimeView | null> {
    const session = await this.prisma.tecnicoTrackingSesion.findFirst({
      where: {
        tecnicoId,

        estado: PrismaEstadoTrackingTecnico.ACTIVA,
      },

      orderBy: {
        iniciadoEn: 'desc',
      },

      select: {
        id: true,

        asistenciaId: true,

        estado: true,

        iniciadoEn: true,

        ultimoHeartbeatEn: true,

        tecnico: {
          select: {
            id: true,

            nombre: true,

            telefono: true,

            rol: true,

            perfil: {
              select: {
                avatarUrl: true,
              },
            },

            ticketsAsignados: {
              where: {
                estado: 'EN_PROCESO',
              },

              select: {
                id: true,

                titulo: true,

                estado: true,

                prioridad: true,
              },
            },
          },
        },

        /*
         * Última evidencia histórica de ESTA sesión.
         *
         * No necesitamos mezclar aquí la proyección
         * UbicacionActual para obtener capturadoEn.
         */
        ubicaciones: {
          take: 1,

          orderBy: [
            {
              capturadoEn: 'desc',
            },
            {
              id: 'desc',
            },
          ],

          select: {
            latitud: true,
            longitud: true,

            precision: true,
            velocidad: true,

            bateria: true,

            capturadoEn: true,

            creadoEn: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    if (!session.asistenciaId) {
      throw new Error(
        'La sesión realtime activa no posee una asistencia asociada.',
      );
    }

    const ubicacion = session.ubicaciones[0] ?? null;

    return {
      tecnico: {
        id: session.tecnico.id,

        nombre: session.tecnico.nombre,

        telefono: session.tecnico.telefono,

        rol: session.tecnico.rol,

        avatarUrl: session.tecnico.perfil?.avatarUrl ?? null,
      },

      tracking: {
        sesionId: session.id,

        asistenciaId: session.asistenciaId,

        estado: TecnicoTrackingSesionPrismaMapper.toDomainEstado(
          session.estado,
        ),

        iniciadoEn: session.iniciadoEn,

        ultimoHeartbeatEn: session.ultimoHeartbeatEn,
      },

      ubicacion: ubicacion
        ? {
            latitud: ubicacion.latitud,

            longitud: ubicacion.longitud,

            precision: ubicacion.precision,

            velocidad: ubicacion.velocidad,

            bateria: ubicacion.bateria,

            capturadoEn: ubicacion.capturadoEn,

            recibidoEn: ubicacion.creadoEn,
          }
        : null,

      actividad: {
        ticketsEnProceso: session.tecnico.ticketsAsignados.map((ticket) => ({
          id: ticket.id,

          titulo: ticket.titulo,

          estado: ticket.estado,

          prioridad: ticket.prioridad,
        })),
      },
    };
  }

  // =====================================================
  // HELPERS
  // =====================================================

  private mapTechnicianSummary(usuario: {
    id: number;

    nombre: string;

    correo: string;

    telefono: string | null;

    rol: string;

    activo: boolean;

    perfil: {
      avatarUrl: string | null;
    } | null;
  }): TecnicoTrackingTecnicoResumen {
    return {
      id: usuario.id,

      nombre: usuario.nombre,

      correo: usuario.correo,

      telefono: usuario.telefono,

      rol: usuario.rol,

      avatarUrl: usuario.perfil?.avatarUrl ?? null,

      activo: usuario.activo,
    };
  }
}
