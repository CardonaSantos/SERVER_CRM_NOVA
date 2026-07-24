import { Injectable } from '@nestjs/common';

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
  PppoeAuditoriaPaginatedResult,
  PppoeAuditoriaRepositoryPort,
} from '../../domain/ports/pppoe-auditoria-repository';
import { PppoeAuditoriaEntity } from '../../domain/entities/pppoe-auditoria.entity';
import { PppoeAuditoriaPrismaMapper } from './pppoe-auditoria-mapper.prisma';
import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../../domain/enums/pppoe-auditoria-enums';

@Injectable()
export class PppoeAuditoriaPrismaRepository
  implements PppoeAuditoriaRepositoryPort
{
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
    const page = this.normalizePage(params.page);

    const limit = this.normalizeLimit(params.limit);

    const where = this.buildWhere(params);

    const orderBy = this.buildOrderBy(params.ordenPor, params.ordenDireccion);

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.pppoeAuditoria.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),

      this.prisma.pppoeAuditoria.count({
        where,
      }),
    ]);

    return {
      data: records.map((record) =>
        PppoeAuditoriaPrismaMapper.toDomain(record),
      ),

      total,
      page,
      limit,

      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
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

    if (params.clienteId !== undefined) {
      this.assertPositiveInteger(params.clienteId, 'clienteId');

      where.clienteId = params.clienteId;
    }

    if (params.accesoInternetId !== undefined) {
      this.assertPositiveInteger(params.accesoInternetId, 'accesoInternetId');

      where.accesoInternetId = params.accesoInternetId;
    }

    if (params.cuentaPppoeId !== undefined) {
      this.assertPositiveInteger(params.cuentaPppoeId, 'cuentaPppoeId');

      where.cuentaPppoeId = params.cuentaPppoeId;
    }

    if (params.perfilHomologacionId !== undefined) {
      this.assertPositiveInteger(
        params.perfilHomologacionId,
        'perfilHomologacionId',
      );

      where.perfilHomologacionId = params.perfilHomologacionId;
    }

    if (params.instalacionId !== undefined) {
      this.assertPositiveInteger(params.instalacionId, 'instalacionId');

      where.instalacionId = params.instalacionId;
    }

    if (params.desinstalacionId !== undefined) {
      this.assertPositiveInteger(params.desinstalacionId, 'desinstalacionId');

      where.desinstalacionId = params.desinstalacionId;
    }

    if (params.operacionId !== undefined) {
      this.assertPositiveInteger(params.operacionId, 'operacionId');

      where.operacionId = params.operacionId;
    }

    if (params.operadorId !== undefined) {
      this.assertPositiveInteger(params.operadorId, 'operadorId');

      where.operadorId = params.operadorId;
    }

    if (params.origen !== undefined) {
      where.origen = this.toPrismaOrigen(params.origen);
    }

    const acciones = this.resolveAcciones(params.accion, params.acciones);

    if (acciones.length === 1) {
      where.accion = this.toPrismaAccion(acciones[0]);
    }

    if (acciones.length > 1) {
      where.accion = {
        in: acciones.map((accion) => this.toPrismaAccion(accion)),
      };
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
}
