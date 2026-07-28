import {
  PppoeOperacionPaso as PrismaPppoeOperacionPaso,
  Prisma,
} from '@prisma/client';

import { PppoeOperacionPrismaEnumMapper } from './pppoe-operacion-prisma-enum.mapper';
import { PppoeOperacionPasoEntity } from '../../domain/entities/pppoe-operacion-paso.entity';
import { CrearPppoeOperacionPasoInicialProps } from '../../domain/props/pppoe-operacion-paso.props';
import { EstadoPasoPppoe } from '../../domain/enums/pppoe-operacion-operacion-paso.enums';

/**
 * Convierte registros Prisma de PppoeOperacionPaso
 * a entidades del dominio y viceversa.
 */
export class PppoeOperacionPasoPrismaMapper {
  /**
   * PRISMA -> DOMINIO
   */

  /**
   * Hidrata una entidad de dominio desde un registro Prisma.
   *
   * PppoeOperacionPasoEntity.restore() vuelve a validar:
   *
   * - identificadores;
   * - estado;
   * - fechas;
   * - duración;
   * - coherencia de errores;
   * - textos técnicos.
   */
  static toDomain(raw: PrismaPppoeOperacionPaso): PppoeOperacionPasoEntity {
    return PppoeOperacionPasoEntity.restore({
      id: raw.id,

      operacionId: raw.operacionId,

      tipo: PppoeOperacionPrismaEnumMapper.tipoPasoToDomain(raw.tipo),

      orden: raw.orden,

      estado: PppoeOperacionPrismaEnumMapper.estadoPasoToDomain(raw.estado),

      comandoSanitizado: raw.comandoSanitizado,

      respuestaSanitizada: raw.respuestaSanitizada,

      errorCodigo: raw.errorCodigo,

      errorMensaje: raw.errorMensaje,

      iniciadoEn: raw.iniciadoEn,

      finalizadoEn: raw.finalizadoEn,

      duracionMs: raw.duracionMs,

      creadoEn: raw.creadoEn,

      actualizadoEn: raw.actualizadoEn,
    });
  }

  /**
   * DOMINIO -> PRISMA CREATE
   */
  /**
   * Utiliza UncheckedCreateInput porque la entidad ya contiene
   * operacionId
   */
  static toCreatePersistence(
    entity: PppoeOperacionPasoEntity,
  ): Prisma.PppoeOperacionPasoUncheckedCreateInput {
    const primitives = entity.toPrimitives();

    if (primitives.id !== null) {
      throw new Error(
        'Un paso PPPoE persistido no puede convertirse en datos de creación.',
      );
    }

    return {
      operacionId: primitives.operacionId,

      tipo: PppoeOperacionPrismaEnumMapper.tipoPasoToPrisma(primitives.tipo),

      orden: primitives.orden,

      estado: PppoeOperacionPrismaEnumMapper.estadoPasoToPrisma(
        primitives.estado,
      ),

      comandoSanitizado: primitives.comandoSanitizado,

      respuestaSanitizada: primitives.respuestaSanitizada,

      errorCodigo: primitives.errorCodigo,

      errorMensaje: primitives.errorMensaje,

      iniciadoEn: primitives.iniciadoEn,

      finalizadoEn: primitives.finalizadoEn,

      duracionMs: primitives.duracionMs,

      creadoEn: primitives.creadoEn,

      actualizadoEn: primitives.actualizadoEn,
    } satisfies Prisma.PppoeOperacionPasoUncheckedCreateInput;
  }

  /**
   * Convierte las props de un paso inicial en datos para
   * una creación anidada dentro de PppoeOperacion.
   * }
   */
  static toNestedCreatePersistence(
    input: CrearPppoeOperacionPasoInicialProps,
  ): Prisma.PppoeOperacionPasoCreateWithoutOperacionInput {
    if (!Number.isInteger(input.orden) || input.orden <= 0) {
      throw new Error('orden debe ser un entero positivo.');
    }

    return {
      tipo: PppoeOperacionPrismaEnumMapper.tipoPasoToPrisma(input.tipo),

      orden: input.orden,

      estado: PppoeOperacionPrismaEnumMapper.estadoPasoToPrisma(
        EstadoPasoPppoe.PENDIENTE,
      ),

      comandoSanitizado: null,

      respuestaSanitizada: null,

      errorCodigo: null,

      errorMensaje: null,

      iniciadoEn: null,

      finalizadoEn: null,

      duracionMs: null,
    } satisfies Prisma.PppoeOperacionPasoCreateWithoutOperacionInput;
  }

  /**
   * DOMINIO -> PRISMA UPDATE
   */

  /**
   * Convierte una entidad persistida en datos para:
   *
   * prisma.pppoeOperacionPaso.update()
   * No actualiza:
   * - operacionId;
   * - tipo;
   * - orden;
   * - creadoEn.
   */
  static toUpdatePersistence(
    entity: PppoeOperacionPasoEntity,
  ): Prisma.PppoeOperacionPasoUncheckedUpdateInput {
    const primitives = entity.toPrimitives();

    if (primitives.id === null) {
      throw new Error(
        'Un paso PPPoE sin id no puede convertirse en datos de actualización.',
      );
    }

    return {
      estado: PppoeOperacionPrismaEnumMapper.estadoPasoToPrisma(
        primitives.estado,
      ),

      comandoSanitizado: primitives.comandoSanitizado,

      respuestaSanitizada: primitives.respuestaSanitizada,

      errorCodigo: primitives.errorCodigo,

      errorMensaje: primitives.errorMensaje,

      iniciadoEn: primitives.iniciadoEn,

      finalizadoEn: primitives.finalizadoEn,

      duracionMs: primitives.duracionMs,
    } satisfies Prisma.PppoeOperacionPasoUncheckedUpdateInput;
  }
}
