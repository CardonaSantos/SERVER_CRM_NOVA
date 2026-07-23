import {
  AccionAuditoriaPppoe as PrismaAccionAuditoriaPppoe,
  EstadoCuentaPppoe as PrismaEstadoCuentaPppoe,
  OrigenOperacionPppoe as PrismaOrigenOperacionPppoe,
  PppoeAuditoria,
  Prisma,
} from '@prisma/client';
import { PppoeAuditoriaEntity } from '../../domain/entities/pppoe-auditoria.entity';
import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../../domain/enums/pppoe-auditoria-enums';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';
import {
  DatosAuditoriaPppoe,
  PppoeAuditoriaJsonValue,
} from '../../domain/props/auditoria-entity-props';

export class PppoeAuditoriaPrismaMapper {
  /**
   * Convierte un registro Prisma en una entidad de dominio.
   */
  static toDomain(record: PppoeAuditoria): PppoeAuditoriaEntity {
    return PppoeAuditoriaEntity.hydrate({
      id: record.id,

      empresaId: record.empresaId,

      clienteId: record.clienteId ?? null,

      accesoInternetId: record.accesoInternetId ?? null,

      cuentaPppoeId: record.cuentaPppoeId ?? null,

      perfilHomologacionId: record.perfilHomologacionId ?? null,

      instalacionId: record.instalacionId ?? null,

      desinstalacionId: record.desinstalacionId ?? null,

      operacionId: record.operacionId ?? null,

      operadorId: record.operadorId ?? null,

      origen: this.mapEnum<OrigenOperacionPppoe>(
        record.origen,
        OrigenOperacionPppoe,
        'origen',
      ),

      accion: this.mapEnum<AccionAuditoriaPppoe>(
        record.accion,
        AccionAuditoriaPppoe,
        'accion',
      ),

      descripcion: record.descripcion,

      estadoCuentaAnterior:
        record.estadoCuentaAnterior === null
          ? null
          : this.mapEnum<EstadoCuentaPppoe>(
              record.estadoCuentaAnterior,
              EstadoCuentaPppoe,
              'estadoCuentaAnterior',
            ),

      estadoCuentaNuevo:
        record.estadoCuentaNuevo === null
          ? null
          : this.mapEnum<EstadoCuentaPppoe>(
              record.estadoCuentaNuevo,
              EstadoCuentaPppoe,
              'estadoCuentaNuevo',
            ),

      usuarioPppoeSnapshot: record.usuarioPppoeSnapshot ?? null,

      perfilCodigoSnapshot: record.perfilCodigoSnapshot ?? null,

      operadorNombreSnapshot: record.operadorNombreSnapshot ?? null,

      datos: this.toDomainDatos(record.datos),

      ipOrigen: record.ipOrigen ?? null,

      userAgent: record.userAgent ?? null,

      creadoEn: new Date(record.creadoEn),
    });
  }

  /**
   * Convierte una auditoría nueva en datos compatibles
   * con prisma.pppoeAuditoria.create().
   */
  static toCreatePersistence(
    entity: PppoeAuditoriaEntity,
  ): Prisma.PppoeAuditoriaUncheckedCreateInput {
    const props = entity.toPrimitives();

    if (props.id !== null) {
      throw new Error(
        'No se puede crear una auditoría PPPoE que ya tiene identificador.',
      );
    }

    return {
      empresaId: props.empresaId,

      clienteId: props.clienteId ?? null,

      accesoInternetId: props.accesoInternetId ?? null,

      cuentaPppoeId: props.cuentaPppoeId ?? null,

      perfilHomologacionId: props.perfilHomologacionId ?? null,

      instalacionId: props.instalacionId ?? null,

      desinstalacionId: props.desinstalacionId ?? null,

      operacionId: props.operacionId ?? null,

      operadorId: props.operadorId ?? null,

      origen: this.mapEnum<PrismaOrigenOperacionPppoe>(
        props.origen,
        PrismaOrigenOperacionPppoe,
        'origen',
      ),

      accion: this.mapEnum<PrismaAccionAuditoriaPppoe>(
        props.accion,
        PrismaAccionAuditoriaPppoe,
        'accion',
      ),

      descripcion: props.descripcion,

      estadoCuentaAnterior:
        props.estadoCuentaAnterior === null
          ? null
          : this.mapEnum<PrismaEstadoCuentaPppoe>(
              props.estadoCuentaAnterior,
              PrismaEstadoCuentaPppoe,
              'estadoCuentaAnterior',
            ),

      estadoCuentaNuevo:
        props.estadoCuentaNuevo === null
          ? null
          : this.mapEnum<PrismaEstadoCuentaPppoe>(
              props.estadoCuentaNuevo,
              PrismaEstadoCuentaPppoe,
              'estadoCuentaNuevo',
            ),

      usuarioPppoeSnapshot: props.usuarioPppoeSnapshot ?? null,

      perfilCodigoSnapshot: props.perfilCodigoSnapshot ?? null,

      operadorNombreSnapshot: props.operadorNombreSnapshot ?? null,

      /**
       * En el dominio, null significa que no hay datos.
       * En Prisma usamos DbNull para almacenar SQL NULL.
       */
      datos:
        props.datos === null
          ? Prisma.DbNull
          : this.toPrismaJsonObject(props.datos),

      ipOrigen: props.ipOrigen ?? null,

      userAgent: props.userAgent ?? null,

      /**
       * Aunque Prisma tenga @default(now()), enviamos
       * la fecha de la entidad para preservar exactamente
       * cuándo ocurrió el evento.
       */
      creadoEn: new Date(props.creadoEn),
    };
  }

  /**
   * Convierte el JSON leído por Prisma al tipo
   * independiente utilizado por el dominio.
   */
  private static toDomainDatos(
    value: Prisma.JsonValue | null,
  ): DatosAuditoriaPppoe | null {
    if (value === null) {
      return null;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(
        'El campo datos de PppoeAuditoria debe contener un objeto JSON.',
      );
    }

    const result: DatosAuditoriaPppoe = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = this.toDomainJsonValue(nestedValue);
    }

    return result;
  }

  private static toDomainJsonValue(
    value: Prisma.JsonValue,
  ): PppoeAuditoriaJsonValue {
    if (value === null) {
      return null;
    }

    if (typeof value === 'string' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new Error('El JSON de auditoría contiene un número no válido.');
      }

      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.toDomainJsonValue(item));
    }

    const result: Record<string, PppoeAuditoriaJsonValue> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = this.toDomainJsonValue(nestedValue);
    }

    return result;
  }

  /**
   * Convierte el objeto JSON del dominio a un objeto
   * aceptado por Prisma.
   */
  private static toPrismaJsonObject(
    value: DatosAuditoriaPppoe,
  ): Prisma.InputJsonObject {
    const result: Record<string, Prisma.InputJsonValue> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = this.toPrismaJsonValue(nestedValue);
    }

    return result;
  }

  private static toPrismaJsonValue(
    value: PppoeAuditoriaJsonValue,
  ): Prisma.InputJsonValue {
    if (value === null) {
      return null;
    }

    if (typeof value === 'string' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new Error(
          'Los datos de auditoría contienen un número no válido para JSON.',
        );
      }

      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.toPrismaJsonValue(item));
    }

    const result: Record<string, Prisma.InputJsonValue> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = this.toPrismaJsonValue(nestedValue);
    }

    return result;
  }

  /**
   * Verifica que los enums de dominio y Prisma
   * continúen compartiendo los mismos valores.
   */
  private static mapEnum<T extends string>(
    value: string,
    enumObject: Record<string, string>,
    field: string,
  ): T {
    if (!Object.values(enumObject).includes(value)) {
      throw new Error(
        `${field} contiene un valor no reconocido por el mapper: ${value}.`,
      );
    }

    return value as T;
  }
}
