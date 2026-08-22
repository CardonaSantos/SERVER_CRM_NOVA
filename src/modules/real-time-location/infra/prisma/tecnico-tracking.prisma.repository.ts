import { Injectable } from '@nestjs/common';

import {
  EstadoTrackingTecnico as PrismaEstadoTrackingTecnico,
  Prisma,
} from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  ExpirarTrackingPersistenceParams,
  ExpirarTrackingPersistenceResult,
  FinalizarTrackingPersistenceParams,
  FinalizarTrackingPersistenceResult,
  IniciarTrackingPersistenceParams,
  IniciarTrackingPersistenceResult,
  RegistrarUbicacionTrackingPersistenceParams,
  RegistrarUbicacionTrackingPersistenceResult,
  TecnicoTrackingRepositoryPort,
} from '../../domain/ports/tecnico-tracking.repository.port';
import { TecnicoTrackingSesionEntity } from '../../domain/entities/real-time-location.entity';
import { TecnicoTrackingSesionPrismaMapper } from './common/tecnico-tracking-sesion.prisma.mapper';
import { UbicacionTecnicoPrismaMapper } from './common/ubicacion-tecnico.prisma.mapper';

@Injectable()
export class TecnicoTrackingPrismaRepository
  implements TecnicoTrackingRepositoryPort
{
  private static readonly SERIALIZABLE_RETRIES = 3;

  constructor(private readonly prisma: PrismaService) {}

  // BUSQUEDA SESION

  async findSessionForTechnician(params: {
    tecnicoId: number;
    sesionTrackingId: number;
  }): Promise<TecnicoTrackingSesionEntity | null> {
    const record = await this.prisma.tecnicoTrackingSesion.findFirst({
      where: {
        id: params.sesionTrackingId,

        tecnicoId: params.tecnicoId,
      },
    });

    if (!record) {
      return null;
    }

    return TecnicoTrackingSesionPrismaMapper.toDomain(record);
  }

  // SESION ACTIVA DEL TECNICO

  async findActiveSessionByTechnician(
    tecnicoId: number,
  ): Promise<TecnicoTrackingSesionEntity | null> {
    const record = await this.prisma.tecnicoTrackingSesion.findFirst({
      where: {
        tecnicoId,

        estado: PrismaEstadoTrackingTecnico.ACTIVA,
      },

      orderBy: {
        iniciadoEn: 'desc',
      },
    });

    if (!record) {
      return null;
    }

    return TecnicoTrackingSesionPrismaMapper.toDomain(record);
  }

  // INICIAR TRACKING

  async startTracking(
    params: IniciarTrackingPersistenceParams,
  ): Promise<IniciarTrackingPersistenceResult> {
    /*
     * Esta operación se ejecuta SERIALIZABLE porque
     * todavía no tenemos una restricción parcial UNIQUE
     * que impida dos sesiones ACTIVA para el mismo técnico.
     *
     * Dentro de la transacción volvemos a consultar la
     * sesión activa aunque el use case ya lo haya hecho.
     *
     * Esto cierra la carrera entre dos requests ON.
     */
    return this.runSerializableTransaction(async (tx) => {
      const activeRecord = await tx.tecnicoTrackingSesion.findFirst({
        where: {
          tecnicoId: params.tecnicoId,

          estado: PrismaEstadoTrackingTecnico.ACTIVA,
        },

        orderBy: {
          iniciadoEn: 'desc',
        },
      });

      /*
       * Idempotencia concurrente:
       *
       * si otro request ON creó la sesión mientras
       * este request esperaba la transacción,
       * devolvemos la sesión ya existente.
       */
      if (activeRecord) {
        if (!activeRecord.asistenciaId) {
          throw new Error('La sesión activa no posee una asistencia asociada.');
        }

        const asistencia = await tx.asistencia.findFirst({
          where: {
            id: activeRecord.asistenciaId,
            usuarioId: params.tecnicoId,
          },
        });

        if (!asistencia) {
          throw new Error(
            'No se encontró la asistencia asociada a la sesión activa.',
          );
        }

        return {
          asistencia: this.mapAttendanceRecord(asistencia),

          sesion: TecnicoTrackingSesionPrismaMapper.toDomain(activeRecord),
        };
      }

      /*
       * La unidad diaria es Asistencia.
       *
       * @@unique([usuarioId, fecha])
       */
      let asistencia = await tx.asistencia.findUnique({
        where: {
          usuarioId_fecha: {
            usuarioId: params.tecnicoId,

            fecha: params.fecha,
          },
        },
      });

      if (!asistencia) {
        /*
         * Primer ON del día.
         *
         * horaEntrada queda fijada aquí y no se
         * reemplazará en activaciones posteriores.
         */
        asistencia = await tx.asistencia.create({
          data: {
            usuarioId: params.tecnicoId,

            fecha: params.fecha,

            horaEntrada: params.iniciadoEn,

            horaSalida: null,
          },
        });
      } else if (asistencia.horaSalida !== null) {
        /*
         * Segundo o posterior ON del día.
         *
         * Reabrimos la jornada pero conservamos
         * la horaEntrada original.
         */
        asistencia = await tx.asistencia.update({
          where: {
            id: asistencia.id,
          },

          data: {
            horaSalida: null,
          },
        });
      }

      const sesion = TecnicoTrackingSesionEntity.create({
        tecnicoId: params.tecnicoId,

        asistenciaId: asistencia.id,

        iniciadoEn: params.iniciadoEn,
      });

      const sessionRecord = await tx.tecnicoTrackingSesion.create({
        data: TecnicoTrackingSesionPrismaMapper.toCreatePersistence(sesion),
      });

      return {
        asistencia: this.mapAttendanceRecord(asistencia),

        sesion: TecnicoTrackingSesionPrismaMapper.toDomain(sessionRecord),
      };
    });
  }

  // REGISTRAR UBICACION

  async registerLocation(
    params: RegistrarUbicacionTrackingPersistenceParams,
  ): Promise<RegistrarUbicacionTrackingPersistenceResult> {
    const sesionProps = params.sesion.toPrimitives();

    const ubicacionProps = params.ubicacion.toPrimitives();

    if (!sesionProps.id) {
      throw new Error('No se puede registrar ubicación en una sesión sin id.');
    }

    if (ubicacionProps.sesionTrackingId !== sesionProps.id) {
      throw new Error('La ubicación no pertenece a la sesión indicada.');
    }

    if (ubicacionProps.tecnicoId !== sesionProps.tecnicoId) {
      throw new Error('La ubicación no pertenece al técnico de la sesión.');
    }

    const ubicacionData = UbicacionTecnicoPrismaMapper.toCreatePersistence(
      params.ubicacion,
    );

    return this.prisma.$transaction(async (tx) => {
      /*
       * Puede haber varios GPS legítimos procesándose
       * al mismo tiempo.
       *
       * Utilizamos optimistic concurrency sobre
       * ultimoHeartbeatEn.
       */
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const currentSession = await tx.tecnicoTrackingSesion.findFirst({
          where: {
            id: sesionProps.id,

            tecnicoId: sesionProps.tecnicoId,
          },
        });

        /*
         * La sesión desapareció o no pertenece
         * al técnico esperado.
         */
        if (!currentSession) {
          return {
            applied: false,
            sesion: null,
            ubicacion: null,
          };
        }

        /*
         * OFF o expiración ganaron la carrera.
         *
         * En este caso el GPS ya no debe
         * incorporarse a la sesión.
         */
        if (currentSession.estado !== PrismaEstadoTrackingTecnico.ACTIVA) {
          return {
            applied: false,
            sesion: null,
            ubicacion: null,
          };
        }

        /*
         * Nunca hacemos retroceder el heartbeat.
         *
         * Si este GPS es más antiguo que otro
         * procesado concurrentemente, conservamos
         * el heartbeat más reciente.
         */
        const incomingHeartbeat = sesionProps.ultimoHeartbeatEn;

        const currentHeartbeat = currentSession.ultimoHeartbeatEn;

        const shouldAdvanceHeartbeat =
          incomingHeartbeat.getTime() > currentHeartbeat.getTime();

        const heartbeatToPersist = shouldAdvanceHeartbeat
          ? incomingHeartbeat
          : currentHeartbeat;

        /*
         * Compare-and-swap.
         *
         * Incluso cuando este GPS es más antiguo
         * hacemos un UPDATE sin retroceder el valor.
         *
         * Esto es deliberado:
         * el UPDATE obtiene el lock de la fila hasta
         * que termine esta transacción.
         *
         * Así un OFF no puede cerrar la sesión entre
         * esta comprobación y el INSERT histórico.
         */
        const lockResult = await tx.tecnicoTrackingSesion.updateMany({
          where: {
            id: currentSession.id,

            tecnicoId: sesionProps.tecnicoId,

            estado: PrismaEstadoTrackingTecnico.ACTIVA,

            ultimoHeartbeatEn: currentHeartbeat,
          },

          data: {
            ultimoHeartbeatEn: heartbeatToPersist,
          },
        });

        /*
         * Otro GPS cambió el heartbeat exactamente
         * entre nuestra lectura y el UPDATE.
         *
         * Volvemos a leer y reintentamos.
         */
        if (lockResult.count !== 1) {
          continue;
        }

        /*
         * A partir de aquí poseemos el lock de la
         * sesión hasta COMMIT.
         *
         * La sesión no puede cerrarse concurrentemente
         * antes de que terminemos de registrar el punto.
         */

        const locationRecord = await tx.ubicacionTecnico.create({
          data: ubicacionData,
        });

        /*
         * UbicacionTecnico SIEMPRE conserva el punto
         * histórico válido.
         *
         * UbicacionActual solamente debe avanzar.
         *
         * Si este request es más antiguo que otro GPS
         * ya confirmado, NO debe sobrescribir el
         * snapshot operacional.
         */
        if (
          shouldAdvanceHeartbeat ||
          incomingHeartbeat.getTime() === currentHeartbeat.getTime()
        ) {
          await tx.ubicacionActual.upsert({
            where: {
              usuarioId: ubicacionProps.tecnicoId,
            },

            create: {
              usuarioId: ubicacionProps.tecnicoId,

              latitud: ubicacionProps.latitud,

              longitud: ubicacionProps.longitud,

              precision: ubicacionProps.precision ?? null,

              velocidad: ubicacionProps.velocidad ?? null,

              bateria: ubicacionProps.bateria ?? null,
            },

            update: {
              latitud: ubicacionProps.latitud,

              longitud: ubicacionProps.longitud,

              precision: ubicacionProps.precision ?? null,

              velocidad: ubicacionProps.velocidad ?? null,

              bateria: ubicacionProps.bateria ?? null,
            },
          });
        }

        const persistedSession = await tx.tecnicoTrackingSesion.findUnique({
          where: {
            id: currentSession.id,
          },
        });

        if (!persistedSession) {
          throw new Error(
            'La sesión desapareció durante el registro de ubicación.',
          );
        }

        return {
          applied: true,

          sesion: TecnicoTrackingSesionPrismaMapper.toDomain(persistedSession),

          ubicacion: UbicacionTecnicoPrismaMapper.toDomain(locationRecord),
        };
      }

      throw new Error(
        'La sesión cambió concurrentemente demasiadas veces durante el registro de ubicación.',
      );
    });
  }

  // FINALIZAR TRACKING

  async finishTracking(
    params: FinalizarTrackingPersistenceParams,
  ): Promise<FinalizarTrackingPersistenceResult> {
    const requested = params.sesion.toPrimitives();

    if (!requested.id) {
      throw new Error('No se puede finalizar una sesión sin id.');
    }

    return this.prisma.$transaction(async (tx) => {
      /*
       * Usamos optimistic concurrency sobre
       * ultimoHeartbeatEn.
       *
       * Esto resuelve la carrera:
       *
       * GPS ↔ OFF
       *
       * Si aparece un heartbeat entre la lectura y
       * el update, volvemos a leer y recalculamos.
       */
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const currentRecord = await tx.tecnicoTrackingSesion.findFirst({
          where: {
            id: requested.id,

            tecnicoId: requested.tecnicoId,

            asistenciaId: params.asistenciaId,
          },
        });

        if (!currentRecord) {
          throw new Error(
            'No se encontró la sesión que se intentaba finalizar.',
          );
        }

        /*
         * Otro request OFF pudo ganar la carrera.
         *
         * Retornamos read-only.
         */
        if (currentRecord.estado === PrismaEstadoTrackingTecnico.FINALIZADA) {
          const asistencia = await this.findAttendanceInTransaction(
            tx,
            params.asistenciaId,
            requested.tecnicoId,
          );

          return {
            sesion: TecnicoTrackingSesionPrismaMapper.toDomain(currentRecord),

            asistencia: this.mapAttendanceRecord(asistencia),
          };
        }

        /*
         * El cron pudo ganar la carrera.
         *
         * No convertimos EXPIRADA → FINALIZADA.
         * El use case transformará esto en 409.
         */
        if (currentRecord.estado === PrismaEstadoTrackingTecnico.EXPIRADA) {
          const asistencia = await this.findAttendanceInTransaction(
            tx,
            params.asistenciaId,
            requested.tecnicoId,
          );

          return {
            sesion: TecnicoTrackingSesionPrismaMapper.toDomain(currentRecord),

            asistencia: this.mapAttendanceRecord(asistencia),
          };
        }

        const currentEntity =
          TecnicoTrackingSesionPrismaMapper.toDomain(currentRecord);

        /*
         * Puede existir un GPS "en vuelo" cuyo heartbeat
         * quedó algunos milisegundos después del instante
         * en que empezó a procesarse el OFF.
         *
         * Nunca finalizamos antes del último tiempo
         * confirmado.
         */
        const effectiveFinishedAt = new Date(
          Math.max(
            params.horaSalida.getTime(),

            currentRecord.ultimoHeartbeatEn.getTime(),
          ),
        );

        currentEntity.finalizar({
          finalizadoEn: effectiveFinishedAt,
        });

        const updatedProps = currentEntity.toPrimitives();

        /*
         * Compare-and-swap usando heartbeat.
         *
         * Si cambió mientras procesábamos,
         * count = 0 y repetimos con el heartbeat nuevo.
         */
        const updated = await tx.tecnicoTrackingSesion.updateMany({
          where: {
            id: currentRecord.id,

            estado: PrismaEstadoTrackingTecnico.ACTIVA,

            ultimoHeartbeatEn: currentRecord.ultimoHeartbeatEn,
          },

          data: {
            estado: updatedProps.estado,

            finalizadoEn: updatedProps.finalizadoEn,

            ultimoHeartbeatEn: updatedProps.ultimoHeartbeatEn,
          },
        });

        if (updated.count !== 1) {
          continue;
        }

        /*
         * OFF explícito:
         *
         * Asistencia.horaSalida usa exactamente
         * el mismo instante confirmado.
         *
         * trabajoCompleto NO se modifica.
         */
        const attendanceUpdate = await tx.asistencia.updateMany({
          where: {
            id: params.asistenciaId,

            usuarioId: requested.tecnicoId,
          },

          data: {
            horaSalida: effectiveFinishedAt,
          },
        });

        if (attendanceUpdate.count !== 1) {
          throw new Error(
            'No se pudo actualizar la asistencia asociada al tracking.',
          );
        }

        const [persistedSession, asistencia] = await Promise.all([
          tx.tecnicoTrackingSesion.findUnique({
            where: {
              id: currentRecord.id,
            },
          }),

          this.findAttendanceInTransaction(
            tx,
            params.asistenciaId,
            requested.tecnicoId,
          ),
        ]);

        if (!persistedSession) {
          throw new Error('No se encontró la sesión después de finalizarla.');
        }

        return {
          sesion: TecnicoTrackingSesionPrismaMapper.toDomain(persistedSession),

          asistencia: this.mapAttendanceRecord(asistencia),
        };
      }

      /*
       * Habría requerido varios heartbeats concurrentes
       * justo durante el cierre.
       *
       * No escribimos un cierre inconsistente.
       */
      throw new Error(
        'La sesión cambió concurrentemente demasiadas veces durante su finalización.',
      );
    });
  }

  // BUSCAR SESIONES STALE

  async findActiveSessionsWithHeartbeatBefore(params: {
    before: Date;
    limit: number;
  }): Promise<TecnicoTrackingSesionEntity[]> {
    const records = await this.prisma.tecnicoTrackingSesion.findMany({
      where: {
        estado: PrismaEstadoTrackingTecnico.ACTIVA,

        ultimoHeartbeatEn: {
          lt: params.before,
        },
      },

      orderBy: {
        ultimoHeartbeatEn: 'asc',
      },

      take: params.limit,
    });

    return records.map((record) =>
      TecnicoTrackingSesionPrismaMapper.toDomain(record),
    );
  }

  // EXPIRAR TRACKING

  async expireTracking(
    params: ExpirarTrackingPersistenceParams,
  ): Promise<ExpirarTrackingPersistenceResult> {
    const sesionProps = params.sesion.toPrimitives();

    if (!sesionProps.id) {
      throw new Error('No se puede expirar una sesión sin id.');
    }

    if (!sesionProps.finalizadoEn) {
      throw new Error('Una sesión expirada debe poseer fecha de finalización.');
    }

    return this.prisma.$transaction(async (tx) => {
      /*
       * Compare-and-swap.
       *
       * Expiramos solamente si:
       *
       * - continúa ACTIVA;
       * - conserva exactamente el heartbeat que
       *   observó el proceso de expiración.
       */
      const updated = await tx.tecnicoTrackingSesion.updateMany({
        where: {
          id: sesionProps.id,

          tecnicoId: sesionProps.tecnicoId,

          estado: PrismaEstadoTrackingTecnico.ACTIVA,

          ultimoHeartbeatEn: params.expectedHeartbeatEn,
        },

        data: {
          estado: PrismaEstadoTrackingTecnico.EXPIRADA,

          finalizadoEn: params.expectedHeartbeatEn,

          ultimoHeartbeatEn: params.expectedHeartbeatEn,
        },
      });

      /*
       * Recuperó heartbeat, se finalizó manualmente
       * o otro proceso ya la expiró.
       */
      if (updated.count !== 1) {
        return {
          applied: false,
          sesion: null,
          asistencia: null,
        };
      }

      /*
       * Último instante confirmado = salida provisional.
       */
      const attendanceUpdate = await tx.asistencia.updateMany({
        where: {
          id: params.asistenciaId,

          usuarioId: sesionProps.tecnicoId,
        },

        data: {
          horaSalida: params.expectedHeartbeatEn,
        },
      });

      if (attendanceUpdate.count !== 1) {
        throw new Error(
          'No se pudo actualizar la asistencia asociada a la sesión expirada.',
        );
      }

      const [persistedSession, asistencia] = await Promise.all([
        tx.tecnicoTrackingSesion.findUnique({
          where: {
            id: sesionProps.id,
          },
        }),

        this.findAttendanceInTransaction(
          tx,
          params.asistenciaId,
          sesionProps.tecnicoId,
        ),
      ]);

      if (!persistedSession) {
        throw new Error(
          'No se encontró la sesión después de expirar el tracking.',
        );
      }

      return {
        applied: true,

        sesion: TecnicoTrackingSesionPrismaMapper.toDomain(persistedSession),

        asistencia: this.mapAttendanceRecord(asistencia),
      };
    });
  }

  // HELPERS - ASISTENCIA

  private async findAttendanceInTransaction(
    tx: Prisma.TransactionClient,
    asistenciaId: number,
    tecnicoId: number,
  ) {
    const asistencia = await tx.asistencia.findFirst({
      where: {
        id: asistenciaId,

        usuarioId: tecnicoId,
      },
    });

    if (!asistencia) {
      throw new Error('No se encontró la asistencia asociada al tracking.');
    }

    return asistencia;
  }

  private mapAttendanceRecord(record: {
    id: number;
    usuarioId: number;

    fecha: Date;

    horaEntrada: Date;
    horaSalida: Date | null;

    minutosTarde: number | null;
    trabajoCompleto: boolean;
  }) {
    return {
      id: record.id,

      tecnicoId: record.usuarioId,

      fecha: record.fecha,

      horaEntrada: record.horaEntrada,

      horaSalida: record.horaSalida,

      minutosTarde: record.minutosTarde,

      trabajoCompleto: record.trabajoCompleto,
    };
  }

  // SERIALIZABLE TRANSACTION

  private async runSerializableTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (
      let attempt = 1;
      attempt <= TecnicoTrackingPrismaRepository.SERIALIZABLE_RETRIES;
      attempt += 1
    ) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        const retryable = this.isSerializableConflict(error);

        if (
          !retryable ||
          attempt === TecnicoTrackingPrismaRepository.SERIALIZABLE_RETRIES
        ) {
          throw error;
        }
      }
    }

    /*
     * TypeScript exige un retorno aunque el loop
     * anterior siempre retorne o lance.
     */
    throw new Error('No fue posible completar la transacción serializable.');
  }

  private isSerializableConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    );
  }
}
