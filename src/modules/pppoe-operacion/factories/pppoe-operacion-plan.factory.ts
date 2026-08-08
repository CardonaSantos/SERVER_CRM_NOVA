import {
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from '../domain/enums/pppoe-operacion-operacion-paso.enums';

import { CrearPppoeOperacionPasoInicialProps } from '../domain/props/pppoe-operacion-paso.props';

/**
 * Construye el plan técnico correspondiente
 * a cada tipo de operación PPPoE.
 *
 * Es una fábrica pura de dominio:
 *
 * - no usa NestJS;
 * - no usa Prisma;
 * - no ejecuta SSH;
 * - no persiste información;
 * - no construye comandos RouterOS.
 *
 * Su responsabilidad es definir qué pasos técnicos
 * pertenecen a cada transición PPPoE y en qué orden.
 *
 * Los planes se encuentran alineados con el
 * requerimiento PPPoE v3 auditado contra RouterOS.
 */
export class PppoeOperacionPlanFactory {
  /**
   * Construye los pasos iniciales de una operación.
   *
   * El orden se deriva directamente de la posición
   * que ocupa cada paso dentro del plan.
   */
  static crearPasos(
    tipo: TipoOperacionPppoe,
  ): CrearPppoeOperacionPasoInicialProps[] {
    const tiposPaso = this.resolverTiposPaso(tipo);

    return tiposPaso.map((tipoPaso, index) => ({
      tipo: tipoPaso,

      orden: index + 1,
    }));
  }

  /**
   * Resuelve el plan técnico correspondiente
   * al tipo de operación.
   */
  private static resolverTiposPaso(tipo: TipoOperacionPppoe): TipoPasoPppoe[] {
    switch (tipo) {
      /*
       * ======================================================
       * ESTADO 2 — EN INSTALACIÓN
       * ======================================================
       *
       * Comando remoto:
       *
       * /ppp secret add
       *   name="..."
       *   password="..."
       *   profile="..."
       *   service="pppoe"
       *
       * El Secret queda habilitado después de crearse.
       */
      case TipoOperacionPppoe.CREAR_SECRET:
        return [
          TipoPasoPppoe.CONECTAR_ROUTER,

          TipoPasoPppoe.BUSCAR_SECRET,

          TipoPasoPppoe.AGREGAR_SECRET,

          TipoPasoPppoe.CONFIRMAR_SECRET,
        ];

      /*
       * ======================================================
       * ESTADO 3 — ACTIVO
       * ======================================================
       *
       * Comando remoto:
       *
       * /ppp secret enable [find name="..."]
       */
      case TipoOperacionPppoe.ACTIVAR_SECRET:
        return [
          TipoPasoPppoe.CONECTAR_ROUTER,

          TipoPasoPppoe.BUSCAR_SECRET,

          TipoPasoPppoe.HABILITAR_SECRET,

          TipoPasoPppoe.CONFIRMAR_SECRET,
        ];

      /*
       * ======================================================
       * ESTADO 4 — SUSPENDIDO
       * ======================================================
       *
       * Comandos remotos, en este orden:
       *
       * /ppp secret disable [find name="..."]
       *
       * /ppp active remove [find name="..."]
       */
      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
        return [
          TipoPasoPppoe.CONECTAR_ROUTER,

          TipoPasoPppoe.BUSCAR_SECRET,

          TipoPasoPppoe.DESHABILITAR_SECRET,

          TipoPasoPppoe.REMOVER_SESION_ACTIVA,

          TipoPasoPppoe.CONFIRMAR_SECRET,
        ];

      /*
       * ======================================================
       * ESTADO 5 — EN DESINSTALACIÓN
       * ======================================================
       *
       * Requerimiento PPPoE v3:
       *
       * /ppp secret remove [find name="..."]
       *
       * /ppp active remove [find name="..."]
       *
       * IMPORTANTE:
       *
       * Estado 5 NO contiene un paso previo
       * DESHABILITAR_SECRET.
       *
       * Tampoco se ejecuta REMOVER_SESION_ACTIVA antes
       * de ELIMINAR_SECRET.
       *
       * El orden auditado es:
       *
       * 1. eliminar Secret;
       * 2. remover sesión activa;
       * 3. confirmar ausencia del Secret.
       */
      case TipoOperacionPppoe.ELIMINAR_SECRET:
        return [
          TipoPasoPppoe.CONECTAR_ROUTER,

          TipoPasoPppoe.BUSCAR_SECRET,

          TipoPasoPppoe.ELIMINAR_SECRET,

          TipoPasoPppoe.REMOVER_SESION_ACTIVA,

          TipoPasoPppoe.CONFIRMAR_SECRET,
        ];

      default: {
        const exhaustiveCheck: never = tipo;

        throw new Error(
          `Tipo de operación PPPoE no soportado: ${String(exhaustiveCheck)}.`,
        );
      }
    }
  }
}

// import {
//   TipoOperacionPppoe,
//   TipoPasoPppoe,
// } from '../domain/enums/pppoe-operacion-operacion-paso.enums';
// import { CrearPppoeOperacionPasoInicialProps } from '../domain/props/pppoe-operacion-paso.props';

// /**
//  * Construye el plan técnico correspondiente
//  * a cada tipo de operación PPPoE.
//  *
//  * Es una fábrica pura de dominio:
//  * - no usa NestJS;
//  * - no usa Prisma;
//  * - no ejecuta SSH;
//  * - no persiste información.
//  */
// export class PppoeOperacionPlanFactory {
//   static crearPasos(
//     tipo: TipoOperacionPppoe,
//   ): CrearPppoeOperacionPasoInicialProps[] {
//     const tiposPaso = this.resolverTiposPaso(tipo);

//     return tiposPaso.map((tipoPaso, index) => ({
//       tipo: tipoPaso,

//       orden: index + 1,
//     }));
//   }

//   private static resolverTiposPaso(tipo: TipoOperacionPppoe): TipoPasoPppoe[] {
//     switch (tipo) {
//       case TipoOperacionPppoe.CREAR_SECRET:
//         return [
//           TipoPasoPppoe.CONECTAR_ROUTER,

//           TipoPasoPppoe.BUSCAR_SECRET,

//           TipoPasoPppoe.AGREGAR_SECRET,

//           TipoPasoPppoe.CONFIRMAR_SECRET,
//         ];

//       case TipoOperacionPppoe.ACTIVAR_SECRET:
//         return [
//           TipoPasoPppoe.CONECTAR_ROUTER,

//           TipoPasoPppoe.BUSCAR_SECRET,

//           TipoPasoPppoe.HABILITAR_SECRET,

//           TipoPasoPppoe.CONFIRMAR_SECRET,
//         ];

//       case TipoOperacionPppoe.SUSPENDER_SERVICIO:
//         return [
//           TipoPasoPppoe.CONECTAR_ROUTER,

//           TipoPasoPppoe.BUSCAR_SECRET,

//           TipoPasoPppoe.DESHABILITAR_SECRET,

//           TipoPasoPppoe.REMOVER_SESION_ACTIVA,

//           TipoPasoPppoe.CONFIRMAR_SECRET,
//         ];

//       case TipoOperacionPppoe.ELIMINAR_SECRET:
//         return [
//           TipoPasoPppoe.CONECTAR_ROUTER,

//           TipoPasoPppoe.BUSCAR_SECRET,

//           TipoPasoPppoe.DESHABILITAR_SECRET,

//           TipoPasoPppoe.REMOVER_SESION_ACTIVA,

//           TipoPasoPppoe.ELIMINAR_SECRET,

//           TipoPasoPppoe.CONFIRMAR_SECRET,
//         ];

//       default: {
//         const exhaustiveCheck: never = tipo;

//         throw new Error(
//           `Tipo de operación PPPoE no soportado: ${String(exhaustiveCheck)}.`,
//         );
//       }
//     }
//   }
// }
