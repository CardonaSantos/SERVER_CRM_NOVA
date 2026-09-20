import {
  CanalOperacionPppoe as PrismaCanalOperacionPppoe,
  EstadoOperacionPppoe as PrismaEstadoOperacionPppoe,
  EstadoPasoPppoe as PrismaEstadoPasoPppoe,
  OrigenOperacionPppoe as PrismaOrigenOperacionPppoe,
  TipoOperacionPppoe as PrismaTipoOperacionPppoe,
  TipoPasoPppoe as PrismaTipoPasoPppoe,
} from '@prisma/client';

import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';
import {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  EstadoPasoPppoe,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from '../../domain/enums/pppoe-operacion-operacion-paso.enums';

/**
 * Convierte los tipos de operación generados por Prisma
 * a los tipos definidos en el dominio.
 */
const tipoOperacionToDomainMap = {
  [PrismaTipoOperacionPppoe.CREAR_SECRET]: TipoOperacionPppoe.CREAR_SECRET,

  [PrismaTipoOperacionPppoe.ACTIVAR_SECRET]: TipoOperacionPppoe.ACTIVAR_SECRET,

  [PrismaTipoOperacionPppoe.SUSPENDER_SERVICIO]:
    TipoOperacionPppoe.SUSPENDER_SERVICIO,

  [PrismaTipoOperacionPppoe.ELIMINAR_SECRET]:
    TipoOperacionPppoe.ELIMINAR_SECRET,
} satisfies Record<PrismaTipoOperacionPppoe, TipoOperacionPppoe>;

/**
 * Convierte los estados de operación generados por Prisma
 * a los estados definidos en el dominio.
 */
const estadoOperacionToDomainMap = {
  [PrismaEstadoOperacionPppoe.PENDIENTE]: EstadoOperacionPppoe.PENDIENTE,

  [PrismaEstadoOperacionPppoe.AUTORIZADA]: EstadoOperacionPppoe.AUTORIZADA,

  [PrismaEstadoOperacionPppoe.EJECUTANDO]: EstadoOperacionPppoe.EJECUTANDO,

  [PrismaEstadoOperacionPppoe.EXITOSA]: EstadoOperacionPppoe.EXITOSA,

  [PrismaEstadoOperacionPppoe.PARCIAL]: EstadoOperacionPppoe.PARCIAL,

  [PrismaEstadoOperacionPppoe.FALLIDA]: EstadoOperacionPppoe.FALLIDA,

  [PrismaEstadoOperacionPppoe.CANCELADA]: EstadoOperacionPppoe.CANCELADA,
} satisfies Record<PrismaEstadoOperacionPppoe, EstadoOperacionPppoe>;

/**
 * Convierte los orígenes generados por Prisma
 * al enum compartido por operación y auditoría.
 */
const origenOperacionToDomainMap = {
  [PrismaOrigenOperacionPppoe.OPERADOR]: OrigenOperacionPppoe.OPERADOR,

  [PrismaOrigenOperacionPppoe.SISTEMA]: OrigenOperacionPppoe.SISTEMA,

  [PrismaOrigenOperacionPppoe.COBRANZA_AUTOMATICA]:
    OrigenOperacionPppoe.COBRANZA_AUTOMATICA,
} satisfies Record<PrismaOrigenOperacionPppoe, OrigenOperacionPppoe>;

/**
 * Convierte los canales generados por Prisma
 * a los canales definidos en el dominio.
 */
const canalOperacionToDomainMap = {
  [PrismaCanalOperacionPppoe.SSH]: CanalOperacionPppoe.SSH,

  [PrismaCanalOperacionPppoe.ROUTEROS_API]: CanalOperacionPppoe.ROUTEROS_API,

  [PrismaCanalOperacionPppoe.MANUAL]: CanalOperacionPppoe.MANUAL,
} satisfies Record<PrismaCanalOperacionPppoe, CanalOperacionPppoe>;

/**
 * Convierte los tipos de paso generados por Prisma
 * a los tipos definidos en el dominio.
 */
const tipoPasoToDomainMap = {
  [PrismaTipoPasoPppoe.CONECTAR_ROUTER]: TipoPasoPppoe.CONECTAR_ROUTER,

  [PrismaTipoPasoPppoe.BUSCAR_SECRET]: TipoPasoPppoe.BUSCAR_SECRET,

  [PrismaTipoPasoPppoe.AGREGAR_SECRET]: TipoPasoPppoe.AGREGAR_SECRET,

  [PrismaTipoPasoPppoe.CONFIRMAR_SECRET]: TipoPasoPppoe.CONFIRMAR_SECRET,

  [PrismaTipoPasoPppoe.HABILITAR_SECRET]: TipoPasoPppoe.HABILITAR_SECRET,

  [PrismaTipoPasoPppoe.DESHABILITAR_SECRET]: TipoPasoPppoe.DESHABILITAR_SECRET,

  [PrismaTipoPasoPppoe.REMOVER_SESION_ACTIVA]:
    TipoPasoPppoe.REMOVER_SESION_ACTIVA,

  [PrismaTipoPasoPppoe.ELIMINAR_SECRET]: TipoPasoPppoe.ELIMINAR_SECRET,
} satisfies Record<PrismaTipoPasoPppoe, TipoPasoPppoe>;

/**
 * Convierte los estados de paso generados por Prisma
 * a los estados definidos en el dominio.
 */
const estadoPasoToDomainMap = {
  [PrismaEstadoPasoPppoe.PENDIENTE]: EstadoPasoPppoe.PENDIENTE,

  [PrismaEstadoPasoPppoe.EJECUTANDO]: EstadoPasoPppoe.EJECUTANDO,

  [PrismaEstadoPasoPppoe.EXITOSO]: EstadoPasoPppoe.EXITOSO,

  [PrismaEstadoPasoPppoe.FALLIDO]: EstadoPasoPppoe.FALLIDO,

  [PrismaEstadoPasoPppoe.OMITIDO]: EstadoPasoPppoe.OMITIDO,
} satisfies Record<PrismaEstadoPasoPppoe, EstadoPasoPppoe>;

/**
 * MAPAS: DOMINIO -> PRISMA
 */

/**
 * Convierte los tipos de operación del dominio
 * a valores aceptados por Prisma.
 */
const tipoOperacionToPrismaMap = {
  [TipoOperacionPppoe.CREAR_SECRET]: PrismaTipoOperacionPppoe.CREAR_SECRET,

  [TipoOperacionPppoe.ACTIVAR_SECRET]: PrismaTipoOperacionPppoe.ACTIVAR_SECRET,

  [TipoOperacionPppoe.SUSPENDER_SERVICIO]:
    PrismaTipoOperacionPppoe.SUSPENDER_SERVICIO,

  [TipoOperacionPppoe.ELIMINAR_SECRET]:
    PrismaTipoOperacionPppoe.ELIMINAR_SECRET,
} satisfies Record<TipoOperacionPppoe, PrismaTipoOperacionPppoe>;

/**
 * Convierte los estados de operación del dominio
 * a valores aceptados por Prisma.
 */
const estadoOperacionToPrismaMap = {
  [EstadoOperacionPppoe.PENDIENTE]: PrismaEstadoOperacionPppoe.PENDIENTE,

  [EstadoOperacionPppoe.AUTORIZADA]: PrismaEstadoOperacionPppoe.AUTORIZADA,

  [EstadoOperacionPppoe.EJECUTANDO]: PrismaEstadoOperacionPppoe.EJECUTANDO,

  [EstadoOperacionPppoe.EXITOSA]: PrismaEstadoOperacionPppoe.EXITOSA,

  [EstadoOperacionPppoe.PARCIAL]: PrismaEstadoOperacionPppoe.PARCIAL,

  [EstadoOperacionPppoe.FALLIDA]: PrismaEstadoOperacionPppoe.FALLIDA,

  [EstadoOperacionPppoe.CANCELADA]: PrismaEstadoOperacionPppoe.CANCELADA,
} satisfies Record<EstadoOperacionPppoe, PrismaEstadoOperacionPppoe>;

/**
 * Convierte los orígenes del dominio
 * a valores aceptados por Prisma.
 */
const origenOperacionToPrismaMap = {
  [OrigenOperacionPppoe.OPERADOR]: PrismaOrigenOperacionPppoe.OPERADOR,

  [OrigenOperacionPppoe.SISTEMA]: PrismaOrigenOperacionPppoe.SISTEMA,

  [OrigenOperacionPppoe.COBRANZA_AUTOMATICA]:
    PrismaOrigenOperacionPppoe.COBRANZA_AUTOMATICA,
} satisfies Record<OrigenOperacionPppoe, PrismaOrigenOperacionPppoe>;

/**
 * Convierte los canales del dominio
 * a valores aceptados por Prisma.
 */
const canalOperacionToPrismaMap = {
  [CanalOperacionPppoe.SSH]: PrismaCanalOperacionPppoe.SSH,

  [CanalOperacionPppoe.ROUTEROS_API]: PrismaCanalOperacionPppoe.ROUTEROS_API,

  [CanalOperacionPppoe.MANUAL]: PrismaCanalOperacionPppoe.MANUAL,
} satisfies Record<CanalOperacionPppoe, PrismaCanalOperacionPppoe>;

/**
 * Convierte los tipos de paso del dominio
 * a valores aceptados por Prisma.
 */
const tipoPasoToPrismaMap = {
  [TipoPasoPppoe.CONECTAR_ROUTER]: PrismaTipoPasoPppoe.CONECTAR_ROUTER,

  [TipoPasoPppoe.BUSCAR_SECRET]: PrismaTipoPasoPppoe.BUSCAR_SECRET,

  [TipoPasoPppoe.AGREGAR_SECRET]: PrismaTipoPasoPppoe.AGREGAR_SECRET,

  [TipoPasoPppoe.CONFIRMAR_SECRET]: PrismaTipoPasoPppoe.CONFIRMAR_SECRET,

  [TipoPasoPppoe.HABILITAR_SECRET]: PrismaTipoPasoPppoe.HABILITAR_SECRET,

  [TipoPasoPppoe.DESHABILITAR_SECRET]: PrismaTipoPasoPppoe.DESHABILITAR_SECRET,

  [TipoPasoPppoe.REMOVER_SESION_ACTIVA]:
    PrismaTipoPasoPppoe.REMOVER_SESION_ACTIVA,

  [TipoPasoPppoe.ELIMINAR_SECRET]: PrismaTipoPasoPppoe.ELIMINAR_SECRET,
} satisfies Record<TipoPasoPppoe, PrismaTipoPasoPppoe>;

/**
 * Convierte los estados de paso del dominio
 * a valores aceptados por Prisma.
 */
const estadoPasoToPrismaMap = {
  [EstadoPasoPppoe.PENDIENTE]: PrismaEstadoPasoPppoe.PENDIENTE,

  [EstadoPasoPppoe.EJECUTANDO]: PrismaEstadoPasoPppoe.EJECUTANDO,

  [EstadoPasoPppoe.EXITOSO]: PrismaEstadoPasoPppoe.EXITOSO,

  [EstadoPasoPppoe.FALLIDO]: PrismaEstadoPasoPppoe.FALLIDO,

  [EstadoPasoPppoe.OMITIDO]: PrismaEstadoPasoPppoe.OMITIDO,
} satisfies Record<EstadoPasoPppoe, PrismaEstadoPasoPppoe>;

/**
 * ============================================================
 * MAPPER PÚBLICO
 * ============================================================
 */

/**
 * Centraliza todas las conversiones entre enums Prisma
 * y enums del dominio PPPoE.
 *
 */
export class PppoeOperacionPrismaEnumMapper {
  static tipoOperacionToDomain(
    value: PrismaTipoOperacionPppoe,
  ): TipoOperacionPppoe {
    return tipoOperacionToDomainMap[value];
  }

  static tipoOperacionToPrisma(
    value: TipoOperacionPppoe,
  ): PrismaTipoOperacionPppoe {
    return tipoOperacionToPrismaMap[value];
  }

  static estadoOperacionToDomain(
    value: PrismaEstadoOperacionPppoe,
  ): EstadoOperacionPppoe {
    return estadoOperacionToDomainMap[value];
  }

  static estadoOperacionToPrisma(
    value: EstadoOperacionPppoe,
  ): PrismaEstadoOperacionPppoe {
    return estadoOperacionToPrismaMap[value];
  }

  static origenOperacionToDomain(
    value: PrismaOrigenOperacionPppoe,
  ): OrigenOperacionPppoe {
    return origenOperacionToDomainMap[value];
  }

  static origenOperacionToPrisma(
    value: OrigenOperacionPppoe,
  ): PrismaOrigenOperacionPppoe {
    return origenOperacionToPrismaMap[value];
  }

  static canalOperacionToDomain(
    value: PrismaCanalOperacionPppoe,
  ): CanalOperacionPppoe {
    return canalOperacionToDomainMap[value];
  }

  static canalOperacionToPrisma(
    value: CanalOperacionPppoe,
  ): PrismaCanalOperacionPppoe {
    return canalOperacionToPrismaMap[value];
  }

  static tipoPasoToDomain(value: PrismaTipoPasoPppoe): TipoPasoPppoe {
    return tipoPasoToDomainMap[value];
  }

  static tipoPasoToPrisma(value: TipoPasoPppoe): PrismaTipoPasoPppoe {
    return tipoPasoToPrismaMap[value];
  }

  static estadoPasoToDomain(value: PrismaEstadoPasoPppoe): EstadoPasoPppoe {
    return estadoPasoToDomainMap[value];
  }

  static estadoPasoToPrisma(value: EstadoPasoPppoe): PrismaEstadoPasoPppoe {
    return estadoPasoToPrismaMap[value];
  }
}
