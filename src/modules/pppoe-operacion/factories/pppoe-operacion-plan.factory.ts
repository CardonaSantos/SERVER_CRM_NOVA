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
 * pertenecen a cada operación y en qué orden.
 *
 * El mismo tipo técnico puede ser utilizado por
 * distintos contextos funcionales.
 *
 * Ejemplo:
 *
 * ELIMINAR_SECRET
 *   - desinstalación;
 *   - baja administrativa manual.
 *
 * Esa diferencia no pertenece al plan técnico.
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
      /**
       * ======================================================
       * CREAR SECRET
       * ======================================================
       *
       * /ppp secret add
       *   name="..."
       *   password="..."
       *   profile="..."
       *   service="pppoe"
       */
      case TipoOperacionPppoe.CREAR_SECRET:
        return [
          TipoPasoPppoe.CONECTAR_ROUTER,

          TipoPasoPppoe.BUSCAR_SECRET,

          TipoPasoPppoe.AGREGAR_SECRET,

          TipoPasoPppoe.CONFIRMAR_SECRET,
        ];

      /**
       * ======================================================
       * ACTIVAR SECRET
       * ======================================================
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

      /**
       * ======================================================
       * SUSPENDER SERVICIO
       * ======================================================
       *
       * Operación reversible.
       *
       * Orden:
       *
       * 1. deshabilitar Secret;
       * 2. remover sesión activa;
       * 3. confirmar estado del Secret.
       */
      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
        return [
          TipoPasoPppoe.CONECTAR_ROUTER,

          TipoPasoPppoe.BUSCAR_SECRET,

          TipoPasoPppoe.DESHABILITAR_SECRET,

          TipoPasoPppoe.REMOVER_SESION_ACTIVA,

          TipoPasoPppoe.CONFIRMAR_SECRET,
        ];

      /**
       * ======================================================
       * ELIMINAR SECRET
       * ======================================================
       *
       * Baja técnica definitiva.
       *
       * Puede ser originada por:
       *
       * - una ClienteDesinstalacion;
       * - una baja administrativa manual.
       *
       * Comandos modificadores:
       *
       * /ppp secret remove [find name="..."]
       *
       * /ppp active remove [find name="..."]
       *
       * Orden obligatorio:
       *
       * 1. conectar;
       * 2. buscar Secret;
       * 3. eliminar Secret;
       * 4. remover sesión activa;
       * 5. confirmar ausencia del Secret.
       *
       * No existe DESHABILITAR_SECRET previo.
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
