import { Injectable } from '@nestjs/common';

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
import { EstadoOperacionPppoe } from '../../domain/enums/pppoe-operacion.enum';
import { PppoeOperacionPrismaMapper } from './pppoe-operacion-prisma.mapper';
import { PppoeOperacionPasoPrismaMapper } from './pppoe-operacion-paso-prisma.mapper';
import { PppoeOperacionEntity } from '../../domain/entities/pppoe-operacion.entity';
import { PppoeOperacionPasoEntity } from '../../domain/entities/pppoe-operacion-paso.entity';
import { PppoeOperacionPrismaEnumMapper } from './pppoe-operacion-enum-prisma.mapper';

/**
 * Repositorio Prisma de operaciones PPPoE.
 *
 * Escritura y lectura de entidades. Las consultas para pantallas están en
 * pppoe-operacion-prisma.query.ts.
 *
 * No contiene reglas de transición de negocio.
 * Estas permanecen en las entidades y casos de uso.
 */
@Injectable()
export class PppoeOperacionPrismaRepository
  implements PppoeOperacionRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

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

  private assertCompanyAndOperationIds(params: {
    empresaId: number;
    operacionId: number;
  }): void {
    this.assertPositiveInteger(params.empresaId, 'empresaId');
    this.assertPositiveInteger(params.operacionId, 'operacionId');
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }
}
