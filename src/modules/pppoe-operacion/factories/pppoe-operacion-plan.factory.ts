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
 * - no usa NestJS;
 * - no usa Prisma;
 * - no ejecuta SSH;
 * - no persiste información.
 */
export class PppoeOperacionPlanFactory {
  static crearPasos(
    tipo: TipoOperacionPppoe,
  ): CrearPppoeOperacionPasoInicialProps[] {
    const tiposPaso = this.resolverTiposPaso(tipo);

    return tiposPaso.map((tipoPaso, index) => ({
      tipo: tipoPaso,

      orden: index + 1,
    }));
  }

  private static resolverTiposPaso(tipo: TipoOperacionPppoe): TipoPasoPppoe[] {
    switch (tipo) {
      case TipoOperacionPppoe.CREAR_SECRET:
        return [
          TipoPasoPppoe.CONECTAR_ROUTER,

          TipoPasoPppoe.BUSCAR_SECRET,

          TipoPasoPppoe.AGREGAR_SECRET,

          TipoPasoPppoe.CONFIRMAR_SECRET,
        ];

      case TipoOperacionPppoe.ACTIVAR_SECRET:
        return [
          TipoPasoPppoe.CONECTAR_ROUTER,

          TipoPasoPppoe.BUSCAR_SECRET,

          TipoPasoPppoe.HABILITAR_SECRET,

          TipoPasoPppoe.CONFIRMAR_SECRET,
        ];

      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
        return [
          TipoPasoPppoe.CONECTAR_ROUTER,

          TipoPasoPppoe.BUSCAR_SECRET,

          TipoPasoPppoe.DESHABILITAR_SECRET,

          TipoPasoPppoe.REMOVER_SESION_ACTIVA,

          TipoPasoPppoe.CONFIRMAR_SECRET,
        ];

      case TipoOperacionPppoe.ELIMINAR_SECRET:
        return [
          TipoPasoPppoe.CONECTAR_ROUTER,

          TipoPasoPppoe.BUSCAR_SECRET,

          TipoPasoPppoe.DESHABILITAR_SECRET,

          TipoPasoPppoe.REMOVER_SESION_ACTIVA,

          TipoPasoPppoe.ELIMINAR_SECRET,

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
