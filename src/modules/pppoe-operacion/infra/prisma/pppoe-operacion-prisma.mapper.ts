import { PppoeOperacion as PrismaPppoeOperacion, Prisma } from '@prisma/client';

import { PppoeOperacionPasoPrismaMapper } from './pppoe-operacion-paso-prisma.mapper';

import { PppoeOperacionPrismaEnumMapper } from './pppoe-operacion-prisma-enum.mapper';
import { PppoeOperacionEntity } from '../../domain/entities/pppoe-operacion.entity';
import { CrearPppoeOperacionPasoInicialProps } from '../../domain/props/pppoe-operacion-paso.props';
import { PppoeOperacionResultado } from '../../domain/props/pppoe-operacion.props';

/**
 * Convierte registros Prisma de PppoeOperacion
 * a entidades del dominio y viceversa.
 */
export class PppoeOperacionPrismaMapper {
  /**
   * PRISMA -> DOMINIO
   */

  /**
   * Hidrata una operación desde un registro Prisma.
   *
   * No necesita cargar relaciones.
   *
   * El método restore() de la entidad validará:
   *
   * - identificadores;
   * - cadena de reintentos;
   * - idempotencia;
   * - autorización;
   * - estados;
   * - snapshots;
   * - resultado JSON;
   * - errores;
   * - fechas;
   * - duración.
   */
  static toDomain(raw: PrismaPppoeOperacion): PppoeOperacionEntity {
    return PppoeOperacionEntity.restore({
      id: raw.id,

      empresaId: raw.empresaId,

      cuentaPppoeId: raw.cuentaPppoeId,

      mikrotikRouterId: raw.mikrotikRouterId,

      perfilHomologacionId: raw.perfilHomologacionId,

      instalacionId: raw.instalacionId,

      desinstalacionId: raw.desinstalacionId,

      reintentoDeId: raw.reintentoDeId,

      numeroIntento: raw.numeroIntento,

      claveIdempotencia: raw.claveIdempotencia,

      tipo: PppoeOperacionPrismaEnumMapper.tipoOperacionToDomain(raw.tipo),

      origen: PppoeOperacionPrismaEnumMapper.origenOperacionToDomain(
        raw.origen,
      ),

      canal: PppoeOperacionPrismaEnumMapper.canalOperacionToDomain(raw.canal),

      estado: PppoeOperacionPrismaEnumMapper.estadoOperacionToDomain(
        raw.estado,
      ),

      iniciadoPorId: raw.iniciadoPorId,

      reautenticadoPorId: raw.reautenticadoPorId,

      requiereReautenticacion: raw.requiereReautenticacion,

      reautenticacionExitosa: raw.reautenticacionExitosa,

      reautenticadoEn: raw.reautenticadoEn,

      usuarioPppoeSnapshot: raw.usuarioPppoeSnapshot,

      codigoPerfilSnapshot: raw.codigoPerfilSnapshot,

      routerHostSnapshot: raw.routerHostSnapshot,

      routerPuertoSnapshot: raw.routerPuertoSnapshot,

      motivo: raw.motivo,

      resultado: this.resultadoToDomain(raw.resultado),

      errorCodigo: raw.errorCodigo,

      errorMensaje: raw.errorMensaje,

      iniciadoEn: raw.iniciadoEn,

      finalizadoEn: raw.finalizadoEn,

      canceladoEn: raw.canceladoEn,

      duracionMs: raw.duracionMs,

      creadoEn: raw.creadoEn,

      actualizadoEn: raw.actualizadoEn,
    });
  }

  /**
   * DOMINIO -> PRISMA CREATE SIN RELACIONES ANIDADAS
   */
  /**
   * Convierte una operación nueva en datos para:
   *
   * prisma.pppoeOperacion.create()
   */
  static toCreatePersistence(
    entity: PppoeOperacionEntity,
  ): Prisma.PppoeOperacionUncheckedCreateInput {
    const primitives = entity.toCreatePrimitives();

    return {
      empresaId: primitives.empresaId,

      cuentaPppoeId: primitives.cuentaPppoeId,

      mikrotikRouterId: primitives.mikrotikRouterId,

      perfilHomologacionId: primitives.perfilHomologacionId,

      instalacionId: primitives.instalacionId,

      desinstalacionId: primitives.desinstalacionId,

      reintentoDeId: primitives.reintentoDeId,

      numeroIntento: primitives.numeroIntento,

      claveIdempotencia: primitives.claveIdempotencia,

      tipo: PppoeOperacionPrismaEnumMapper.tipoOperacionToPrisma(
        primitives.tipo,
      ),

      origen: PppoeOperacionPrismaEnumMapper.origenOperacionToPrisma(
        primitives.origen,
      ),

      canal: PppoeOperacionPrismaEnumMapper.canalOperacionToPrisma(
        primitives.canal,
      ),

      estado: PppoeOperacionPrismaEnumMapper.estadoOperacionToPrisma(
        primitives.estado,
      ),

      iniciadoPorId: primitives.iniciadoPorId,

      reautenticadoPorId: primitives.reautenticadoPorId,

      requiereReautenticacion: primitives.requiereReautenticacion,

      reautenticacionExitosa: primitives.reautenticacionExitosa,

      reautenticadoEn: primitives.reautenticadoEn,

      usuarioPppoeSnapshot: primitives.usuarioPppoeSnapshot,

      codigoPerfilSnapshot: primitives.codigoPerfilSnapshot,

      routerHostSnapshot: primitives.routerHostSnapshot,

      routerPuertoSnapshot: primitives.routerPuertoSnapshot,

      motivo: primitives.motivo,

      resultado: this.resultadoToPersistence(primitives.resultado),

      errorCodigo: primitives.errorCodigo,

      errorMensaje: primitives.errorMensaje,

      iniciadoEn: primitives.iniciadoEn,

      finalizadoEn: primitives.finalizadoEn,

      canceladoEn: primitives.canceladoEn,

      duracionMs: primitives.duracionMs,

      creadoEn: primitives.creadoEn,

      actualizadoEn: primitives.actualizadoEn,
    } satisfies Prisma.PppoeOperacionUncheckedCreateInput;
  }

  /**
   * DOMINIO -> PRISMA CREATE CON PASOS
   */

  /**
   * Convierte una operación y sus pasos iniciales en datos para
   * una creación anidada:
   *
   * prisma.pppoeOperacion.create({
   *   data: mapper.toCreateWithStepsPersistence(...)
   * })
   *
   * Usa PppoeOperacionCreateInput porque necesita trabajar
   * mediante relaciones connect y nested create.
   */
  static toCreateWithStepsPersistence(
    entity: PppoeOperacionEntity,
    pasos: CrearPppoeOperacionPasoInicialProps[],
  ): Prisma.PppoeOperacionCreateInput {
    const primitives = entity.toCreatePrimitives();

    this.assertInitialSteps(pasos);

    return {
      /**
       * RELACIONES OBLIGATORIAS
       */

      empresa: {
        connect: {
          id: primitives.empresaId,
        },
      },

      cuentaPppoe: {
        connect: {
          id: primitives.cuentaPppoeId,
        },
      },

      mikrotikRouter: {
        connect: {
          id: primitives.mikrotikRouterId,
        },
      },

      /**
       * RELACIONES OPCIONALES
       */

      perfilHomologacion:
        primitives.perfilHomologacionId === null
          ? undefined
          : {
              connect: {
                id: primitives.perfilHomologacionId,
              },
            },

      instalacion:
        primitives.instalacionId === null
          ? undefined
          : {
              connect: {
                id: primitives.instalacionId,
              },
            },

      desinstalacion:
        primitives.desinstalacionId === null
          ? undefined
          : {
              connect: {
                id: primitives.desinstalacionId,
              },
            },

      iniciadoPor:
        primitives.iniciadoPorId === null
          ? undefined
          : {
              connect: {
                id: primitives.iniciadoPorId,
              },
            },

      reautenticadoPor:
        primitives.reautenticadoPorId === null
          ? undefined
          : {
              connect: {
                id: primitives.reautenticadoPorId,
              },
            },

      reintentoDe:
        primitives.reintentoDeId === null
          ? undefined
          : {
              connect: {
                id: primitives.reintentoDeId,
              },
            },

      /**
       * PASOS TÉCNICOS INICIALES
       */

      pasos: {
        create: pasos.map((paso) =>
          PppoeOperacionPasoPrismaMapper.toNestedCreatePersistence(paso),
        ),
      },

      /**
       * REINTENTOS E IDEMPOTENCIA
       */

      numeroIntento: primitives.numeroIntento,

      claveIdempotencia: primitives.claveIdempotencia,

      /**
       * CLASIFICACIÓN
       */

      tipo: PppoeOperacionPrismaEnumMapper.tipoOperacionToPrisma(
        primitives.tipo,
      ),

      origen: PppoeOperacionPrismaEnumMapper.origenOperacionToPrisma(
        primitives.origen,
      ),

      canal: PppoeOperacionPrismaEnumMapper.canalOperacionToPrisma(
        primitives.canal,
      ),

      estado: PppoeOperacionPrismaEnumMapper.estadoOperacionToPrisma(
        primitives.estado,
      ),

      /**
       * AUTORIZACIÓN
       */

      requiereReautenticacion: primitives.requiereReautenticacion,

      reautenticacionExitosa: primitives.reautenticacionExitosa,

      reautenticadoEn: primitives.reautenticadoEn,

      /**
       * SNAPSHOTS NO SENSIBLES
       */

      usuarioPppoeSnapshot: primitives.usuarioPppoeSnapshot,

      codigoPerfilSnapshot: primitives.codigoPerfilSnapshot,

      routerHostSnapshot: primitives.routerHostSnapshot,

      routerPuertoSnapshot: primitives.routerPuertoSnapshot,

      /**
       * RESULTADO
       */

      motivo: primitives.motivo,

      resultado: this.resultadoToPersistence(primitives.resultado),

      errorCodigo: primitives.errorCodigo,

      errorMensaje: primitives.errorMensaje,

      /**
       * TIEMPOS
       */

      iniciadoEn: primitives.iniciadoEn,

      finalizadoEn: primitives.finalizadoEn,

      canceladoEn: primitives.canceladoEn,

      duracionMs: primitives.duracionMs,

      creadoEn: primitives.creadoEn,

      actualizadoEn: primitives.actualizadoEn,
    } satisfies Prisma.PppoeOperacionCreateInput;
  }

  /**
   * DOMINIO -> PRISMA UPDATE
   */

  /**
   * Convierte una entidad persistida en datos para:
   *
   * prisma.pppoeOperacion.update()
   *
   * Solo actualiza los campos que pueden cambiar durante
   * el ciclo de vida de una operación.
   *
   * No actualiza:
   *
   * - empresa;
   * - cuenta PPPoE;
   * - router;
   * - perfil;
   * - instalación;
   * - desinstalación;
   * - cadena de reintentos;
   * - clave de idempotencia;
   * - tipo;
   * - origen;
   * - canal;
   * - snapshots históricos;
   * - creadoEn.
   */
  static toUpdatePersistence(
    entity: PppoeOperacionEntity,
  ): Prisma.PppoeOperacionUncheckedUpdateInput {
    const primitives = entity.toPersistedPrimitives();

    return {
      estado: PppoeOperacionPrismaEnumMapper.estadoOperacionToPrisma(
        primitives.estado,
      ),

      reautenticadoPorId: primitives.reautenticadoPorId,

      requiereReautenticacion: primitives.requiereReautenticacion,

      reautenticacionExitosa: primitives.reautenticacionExitosa,

      reautenticadoEn: primitives.reautenticadoEn,

      motivo: primitives.motivo,

      resultado: this.resultadoToPersistence(primitives.resultado),

      errorCodigo: primitives.errorCodigo,

      errorMensaje: primitives.errorMensaje,

      iniciadoEn: primitives.iniciadoEn,

      finalizadoEn: primitives.finalizadoEn,

      canceladoEn: primitives.canceladoEn,

      duracionMs: primitives.duracionMs,
    } satisfies Prisma.PppoeOperacionUncheckedUpdateInput;
  }

  /**
   * RESULTADO JSON
   */

  /**
   * Convierte el campo Json de Prisma al resultado
   * aceptado por el dominio.
   *
   * El dominio únicamente acepta un objeto JSON.
   * No acepta arrays, strings o números como raíz.
   */
  private static resultadoToDomain(
    value: Prisma.JsonValue | null,
  ): PppoeOperacionResultado | null {
    if (value === null) {
      return null;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(
        'El resultado persistido de una operación PPPoE debe ser un objeto JSON.',
      );
    }

    return value as PppoeOperacionResultado;
  }

  /**
   * Convierte el resultado del dominio a un valor
   * compatible con Prisma.
   *
   * Prisma distingue entre:
   *
   * - NULL de base de datos: Prisma.DbNull;
   * - null dentro de JSON: Prisma.JsonNull.
   *
   * En este módulo usamos NULL de base de datos cuando
   * la operación no contiene resultado.
   */
  private static resultadoToPersistence(value: PppoeOperacionResultado | null) {
    if (value === null) {
      return Prisma.DbNull;
    }

    return value as Prisma.InputJsonValue;
  }

  /**
   * VALIDACIÓN DE PASOS INICIALES
   */

  /**
   * Valida la secuencia mínima antes de construir
   * una creación anidada.
   *
   * La base de datos también protege el orden mediante:
   *
   * @@unique([operacionId, orden])
   */
  private static assertInitialSteps(
    pasos: CrearPppoeOperacionPasoInicialProps[],
  ): void {
    if (pasos.length === 0) {
      throw new Error(
        'Una operación PPPoE debe contener al menos un paso inicial.',
      );
    }

    const ordenes = pasos.map((paso) => paso.orden);

    const ordenesUnicos = new Set(ordenes);

    if (ordenesUnicos.size !== ordenes.length) {
      throw new Error('Los pasos iniciales no pueden repetir el mismo orden.');
    }

    const ordenesOrdenados = [...ordenes].sort((a, b) => a - b);

    for (let index = 0; index < ordenesOrdenados.length; index += 1) {
      const ordenEsperado = index + 1;

      if (ordenesOrdenados[index] !== ordenEsperado) {
        throw new Error(
          `La secuencia de pasos debe ser continua y comenzar en 1. Se esperaba el orden ${ordenEsperado}.`,
        );
      }
    }
  }
}
