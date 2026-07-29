import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  BuscarPppoeOperacionEnCursoParams,
  BuscarPppoeOperacionPasoPorIdParams,
  BuscarPppoeOperacionPasoPorOrdenParams,
  BuscarPppoeOperacionPorIdempotenciaParams,
  BuscarPppoeOperacionPorIdParams,
  BuscarUltimaOperacionCuentaPppoeParams,
  BuscarUltimoIntentoPppoeParams,
  CrearPppoeOperacionAggregateParams,
  GuardarPppoeOperacionPasoParams,
  PppoeOperacionAggregate,
  PppoeOperacionRepositoryPort,
  ReclamarPppoeOperacionParaEjecucionParams,
} from '../../domain/ports/pppoe-operacion-repository.port';
import { EstadoOperacionPppoe } from '../../domain/enums/pppoe-operacion-operacion-paso.enums';
import {
  BuscarPppoeOperacionDetalleParams,
  PppoeOperacionQueryPort,
} from '../../domain/ports/pppoe-operacion-query.port';
import { PppoeOperacionPrismaMapper } from './pppoe-operacion-prisma.mapper';
import { PppoeOperacionPasoPrismaMapper } from './pppoe-operacion-paso-prisma.mapper';
import { PppoeOperacionEntity } from '../../domain/entities/pppoe-operacion.entity';
import { PppoeOperacionPasoEntity } from '../../domain/entities/pppoe-operacion-paso.entity';
import { PppoeOperacionPrismaEnumMapper } from './pppoe-operacion-prisma-enum.mapper';
import {
  PppoeOperacionFindManyFilters,
  PppoeOperacionPaginatedResult,
} from '../../domain/read-models/pppoe-operacion.read-model';
import {
  PPPOE_OPERACION_DETAIL_INCLUDE,
  PPPOE_OPERACION_LIST_INCLUDE,
  PppoeOperacionReadModelPrismaMapper,
} from './pppoe-operacion-read-model-prisma.mapper';

/**
 * Repositorio Prisma de operaciones PPPoE.
 *
 * Implementa:
 *
 * - el puerto de escritura basado en entidades;
 * - el puerto de consultas enriquecidas para UI.
 *
 * No contiene reglas de transición de negocio.
 * Estas permanecen en las entidades y casos de uso.
 */
@Injectable()
export class PppoeOperacionPrismaRepository
  implements PppoeOperacionRepositoryPort, PppoeOperacionQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  /**
   * CREACIÓN
   */

  /**
   * Crea una operación y todos sus pasos iniciales
   * mediante nested create.
   */
  async createWithSteps(
    params: CrearPppoeOperacionAggregateParams,
  ): Promise<PppoeOperacionAggregate> {
    const data = PppoeOperacionPrismaMapper.toCreateWithStepsPersistence(
      params.operacion,
      params.pasos,
    );

    const created = await this.prisma.pppoeOperacion.create({
      data,

      include: {
        pasos: {
          orderBy: {
            orden: 'asc',
          },
        },
      },
    });

    return {
      operacion: PppoeOperacionPrismaMapper.toDomain(created),

      pasos: created.pasos.map((paso) =>
        PppoeOperacionPasoPrismaMapper.toDomain(paso),
      ),
    };
  }

  /**
   * ACTUALIZACIÓN DE OPERACIÓN
   * Persiste los cambios realizados por los métodos
   * de PppoeOperacionEntity.
   */
  async saveOperation(
    entity: PppoeOperacionEntity,
  ): Promise<PppoeOperacionEntity> {
    const primitives = entity.toPersistedPrimitives();

    /**
     * Validamos empresa e id antes del update para evitar
     * modificar una operación fuera del contexto esperado.
     */
    const exists = await this.prisma.pppoeOperacion.findFirst({
      where: {
        id: primitives.id,
        empresaId: primitives.empresaId,
      },
      select: {
        id: true,
      },
    });

    if (!exists) {
      throw new Error(
        `No existe la operación PPPoE ${primitives.id} en la empresa ${primitives.empresaId}.`,
      );
    }

    const updated = await this.prisma.pppoeOperacion.update({
      where: {
        id: primitives.id,
      },

      data: PppoeOperacionPrismaMapper.toUpdatePersistence(entity),
    });

    return PppoeOperacionPrismaMapper.toDomain(updated);
  }

  /**
   * Reclama atómicamente una operación para su ejecución.
   *
   * Solo una solicitud puede cambiar:
   *
   * PENDIENTE | AUTORIZADA -> EJECUTANDO
   *
   * Cuando otra solicitud cambió previamente el estado,
   * updateMany devuelve count = 0 y no se ejecutará SSH.
   */
  async claimForExecution(
    params: ReclamarPppoeOperacionParaEjecucionParams,
  ): Promise<PppoeOperacionEntity | null> {
    this.assertCompanyAndOperationIds(params);

    const primitives = params.operacionIniciada.toPersistedPrimitives();

    if (primitives.id !== params.operacionId) {
      throw new Error('La operación iniciada no coincide con operacionId.');
    }

    if (primitives.empresaId !== params.empresaId) {
      throw new Error(
        'La operación iniciada no pertenece a la empresa indicada.',
      );
    }

    if (primitives.estado !== EstadoOperacionPppoe.EJECUTANDO) {
      throw new Error(
        `La operación reclamada debe estar EJECUTANDO. Estado recibido: ${primitives.estado}.`,
      );
    }

    if (!primitives.iniciadoEn) {
      throw new Error('La operación reclamada debe contener iniciadoEn.');
    }

    const result = await this.prisma.pppoeOperacion.updateMany({
      where: {
        id: params.operacionId,

        empresaId: params.empresaId,

        /**
         * Compare-and-set.
         *
         * La actualización solo ocurre si el registro
         * todavía conserva el estado esperado.
         */
        estado: PppoeOperacionPrismaEnumMapper.estadoOperacionToPrisma(
          params.estadoEsperado,
        ),
      },

      data: {
        estado: PppoeOperacionPrismaEnumMapper.estadoOperacionToPrisma(
          EstadoOperacionPppoe.EJECUTANDO,
        ),

        iniciadoEn: primitives.iniciadoEn,
      },
    });

    /**
     * Otra solicitud reclamó o modificó la operación.
     */
    if (result.count === 0) {
      return null;
    }

    /**
     * Por id solo puede actualizarse un registro.
     */
    if (result.count !== 1) {
      throw new Error(
        `La reclamación de la operación ${params.operacionId} modificó una cantidad inesperada de registros: ${result.count}.`,
      );
    }

    const claimed = await this.prisma.pppoeOperacion.findFirst({
      where: {
        id: params.operacionId,

        empresaId: params.empresaId,
      },
    });

    if (!claimed) {
      throw new Error(
        `La operación PPPoE ${params.operacionId} fue reclamada, pero no pudo recargarse.`,
      );
    }

    return PppoeOperacionPrismaMapper.toDomain(claimed);
  }

  /**
   * ACTUALIZACIÓN DE PASO
  /**
   * Persiste los cambios de un paso técnico.
   *
   * Se comprueba:
   * - id del paso;
   * - operación propietaria;
   * - empresa propietaria de la operación.
   */
  async saveStep(
    params: GuardarPppoeOperacionPasoParams,
  ): Promise<PppoeOperacionPasoEntity> {
    this.assertPositiveInteger(params.empresaId, 'empresaId');

    const primitives = params.paso.toPrimitives();

    if (primitives.id === null) {
      throw new Error(
        'No puede actualizarse un paso que todavía no fue persistido.',
      );
    }

    const exists = await this.prisma.pppoeOperacionPaso.findFirst({
      where: {
        id: primitives.id,

        operacionId: primitives.operacionId,

        operacion: {
          empresaId: params.empresaId,
        },
      },

      select: {
        id: true,
      },
    });

    if (!exists) {
      throw new Error(
        `No existe el paso PPPoE ${primitives.id} dentro de la operación ${primitives.operacionId} para la empresa ${params.empresaId}.`,
      );
    }

    const updated = await this.prisma.pppoeOperacionPaso.update({
      where: {
        id: primitives.id,
      },

      data: PppoeOperacionPasoPrismaMapper.toUpdatePersistence(params.paso),
    });

    return PppoeOperacionPasoPrismaMapper.toDomain(updated);
  }

  /**
   * BÚSQUEDA DE OPERACIÓN
  /**
   * Busca una operación simple sin cargar relaciones.
   */
  async findById(
    params: BuscarPppoeOperacionPorIdParams,
  ): Promise<PppoeOperacionEntity | null> {
    this.assertCompanyAndOperationIds(params);

    const found = await this.prisma.pppoeOperacion.findFirst({
      where: {
        id: params.operacionId,

        empresaId: params.empresaId,
      },
    });

    return found ? PppoeOperacionPrismaMapper.toDomain(found) : null;
  }

  /**
   * Busca una operación junto con todos sus pasos.
   */
  async findAggregateById(
    params: BuscarPppoeOperacionPorIdParams,
  ): Promise<PppoeOperacionAggregate | null> {
    this.assertCompanyAndOperationIds(params);

    const found = await this.prisma.pppoeOperacion.findFirst({
      where: {
        id: params.operacionId,

        empresaId: params.empresaId,
      },

      include: {
        pasos: {
          orderBy: {
            orden: 'asc',
          },
        },
      },
    });

    if (!found) {
      return null;
    }

    return {
      operacion: PppoeOperacionPrismaMapper.toDomain(found),

      pasos: found.pasos.map((paso) =>
        PppoeOperacionPasoPrismaMapper.toDomain(paso),
      ),
    };
  }

  /**
   * BÚSQUEDA DE PASOS
   * Busca un paso por id y verifica que pertenezca
   * a la operación y empresa indicadas.
   */
  async findStepById(
    params: BuscarPppoeOperacionPasoPorIdParams,
  ): Promise<PppoeOperacionPasoEntity | null> {
    this.assertPositiveInteger(params.empresaId, 'empresaId');

    this.assertPositiveInteger(params.operacionId, 'operacionId');

    this.assertPositiveInteger(params.pasoId, 'pasoId');

    const found = await this.prisma.pppoeOperacionPaso.findFirst({
      where: {
        id: params.pasoId,

        operacionId: params.operacionId,

        operacion: {
          empresaId: params.empresaId,
        },
      },
    });

    return found ? PppoeOperacionPasoPrismaMapper.toDomain(found) : null;
  }

  /**
   * Busca un paso mediante su orden dentro
   * de una operación.
   */
  async findStepByOrder(
    params: BuscarPppoeOperacionPasoPorOrdenParams,
  ): Promise<PppoeOperacionPasoEntity | null> {
    this.assertPositiveInteger(params.empresaId, 'empresaId');

    this.assertPositiveInteger(params.operacionId, 'operacionId');

    this.assertPositiveInteger(params.orden, 'orden');

    const found = await this.prisma.pppoeOperacionPaso.findFirst({
      where: {
        operacionId: params.operacionId,

        orden: params.orden,

        operacion: {
          empresaId: params.empresaId,
        },
      },
    });

    return found ? PppoeOperacionPasoPrismaMapper.toDomain(found) : null;
  }

  /**
   * IDEMPOTENCIA
   * Busca una operación mediante la restricción única:
   * @@unique([empresaId, claveIdempotencia])
   */
  async findByIdempotencyKey(
    params: BuscarPppoeOperacionPorIdempotenciaParams,
  ): Promise<PppoeOperacionEntity | null> {
    this.assertPositiveInteger(params.empresaId, 'empresaId');

    const claveIdempotencia = params.claveIdempotencia.trim();

    if (!claveIdempotencia) {
      throw new Error('claveIdempotencia es obligatoria.');
    }

    const found = await this.prisma.pppoeOperacion.findUnique({
      where: {
        empresaId_claveIdempotencia: {
          empresaId: params.empresaId,

          claveIdempotencia,
        },
      },
    });

    return found ? PppoeOperacionPrismaMapper.toDomain(found) : null;
  }

  /**
   * OPERACIONES EN CURSO
  /**
   * Busca una operación activa sobre una cuenta PPPoE.
   */
  async findRunningOperation(
    params: BuscarPppoeOperacionEnCursoParams,
  ): Promise<PppoeOperacionEntity | null> {
    this.assertPositiveInteger(params.empresaId, 'empresaId');

    this.assertPositiveInteger(params.cuentaPppoeId, 'cuentaPppoeId');

    if (params.estados.length === 0) {
      throw new Error(
        'Debe indicarse al menos un estado considerado en curso.',
      );
    }

    const found = await this.prisma.pppoeOperacion.findFirst({
      where: {
        empresaId: params.empresaId,

        cuentaPppoeId: params.cuentaPppoeId,

        tipo:
          params.tipo === null || params.tipo === undefined
            ? undefined
            : PppoeOperacionPrismaEnumMapper.tipoOperacionToPrisma(params.tipo),

        estado: {
          in: params.estados.map((estado) =>
            PppoeOperacionPrismaEnumMapper.estadoOperacionToPrisma(estado),
          ),
        },

        id:
          params.excluirOperacionId === null ||
          params.excluirOperacionId === undefined
            ? undefined
            : {
                not: params.excluirOperacionId,
              },
      },

      orderBy: {
        creadoEn: 'desc',
      },
    });

    return found ? PppoeOperacionPrismaMapper.toDomain(found) : null;
  }

  /**
   * REINTENTOS
   * Busca el último intento de una cadena.
   * Incluye:
   * - la operación raíz;
   * - todos los registros cuyo reintentoDeId apunta a ella.
   */
  async findLatestAttempt(
    params: BuscarUltimoIntentoPppoeParams,
  ): Promise<PppoeOperacionEntity | null> {
    this.assertPositiveInteger(params.empresaId, 'empresaId');

    this.assertPositiveInteger(params.operacionRaizId, 'operacionRaizId');

    const found = await this.prisma.pppoeOperacion.findFirst({
      where: {
        empresaId: params.empresaId,

        OR: [
          {
            id: params.operacionRaizId,
          },
          {
            reintentoDeId: params.operacionRaizId,
          },
        ],
      },

      orderBy: [
        {
          numeroIntento: 'desc',
        },
        {
          creadoEn: 'desc',
        },
      ],
    });

    return found ? PppoeOperacionPrismaMapper.toDomain(found) : null;
  }

  /**
   * Busca la operación más reciente realizada
   * sobre una cuenta PPPoE.
   */
  async findLatestByAccount(
    params: BuscarUltimaOperacionCuentaPppoeParams,
  ): Promise<PppoeOperacionEntity | null> {
    this.assertPositiveInteger(params.empresaId, 'empresaId');

    this.assertPositiveInteger(params.cuentaPppoeId, 'cuentaPppoeId');

    const found = await this.prisma.pppoeOperacion.findFirst({
      where: {
        empresaId: params.empresaId,

        cuentaPppoeId: params.cuentaPppoeId,

        tipo:
          params.tipo === null || params.tipo === undefined
            ? undefined
            : PppoeOperacionPrismaEnumMapper.tipoOperacionToPrisma(params.tipo),
      },

      orderBy: [
        {
          creadoEn: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    });

    return found ? PppoeOperacionPrismaMapper.toDomain(found) : null;
  }

  /**
   * LISTADO PAGINADO
   * Devuelve operaciones paginadas con relaciones
   * resumidas para la UI.
   */
  async findPaginated(
    filters: PppoeOperacionFindManyFilters,
  ): Promise<PppoeOperacionPaginatedResult> {
    this.assertPositiveInteger(filters.empresaId, 'empresaId');

    this.assertPositiveInteger(filters.page, 'page');

    this.assertPositiveInteger(filters.limit, 'limit');

    const where = this.buildFindManyWhere(filters);

    const orderBy = this.buildFindManyOrderBy(filters);

    const skip = (filters.page - 1) * filters.limit;

    const [total, records] = await Promise.all([
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
    this.assertCompanyAndOperationIds(params);

    const found = await this.prisma.pppoeOperacion.findFirst({
      where: {
        id: params.operacionId,

        empresaId: params.empresaId,
      },

      include: PPPOE_OPERACION_DETAIL_INCLUDE,
    });

    return found ? PppoeOperacionReadModelPrismaMapper.toDetail(found) : null;
  }

  /**
   * CONSTRUCCIÓN DE FILTROS
   * Construye el where Prisma del listado paginado.
   */
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
      empresaId: filters.empresaId,

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

  /**
   * Construye el OR de campos buscables para un token.
   */
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

  /**
   * Construye el ordenamiento solicitado.
   */
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

  /**
   * NORMALIZACIÓN Y VALIDACIONES
   * Divide la búsqueda en tokens limpios.
   */
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

  /**
   * Valida empresaId y operacionId.
   */
  private assertCompanyAndOperationIds(params: {
    empresaId: number;
    operacionId: number;
  }): void {
    this.assertPositiveInteger(params.empresaId, 'empresaId');

    this.assertPositiveInteger(params.operacionId, 'operacionId');
  }

  /**
   * Valida un entero positivo.
   */
  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }
}
