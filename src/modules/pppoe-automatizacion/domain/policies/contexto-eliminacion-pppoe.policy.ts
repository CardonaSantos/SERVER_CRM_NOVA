import { TipoOperacionPppoe } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

import { ContextoEliminacionPppoe } from '../enums/contexto-eliminacion-pppoe.enum';

/**
 * Contexto de una operación ELIMINAR_SECRET a partir de sus relaciones:
 * con desinstalación es el flujo formal (conserve o no su instalación); sin
 * instalación ni desinstalación es una baja manual. Una instalación sola
 * nunca origina una eliminación. Devuelve null si no es ELIMINAR_SECRET.
 */
export function resolverContextoEliminacion(operacion: {
  tipo: TipoOperacionPppoe;
  instalacionId: number | null;
  desinstalacionId: number | null;
}): ContextoEliminacionPppoe | null {
  if (operacion.tipo !== TipoOperacionPppoe.ELIMINAR_SECRET) return null;
  if (operacion.desinstalacionId !== null) {
    return ContextoEliminacionPppoe.DESINSTALACION;
  }
  return operacion.instalacionId === null
    ? ContextoEliminacionPppoe.BAJA_MANUAL
    : ContextoEliminacionPppoe.CONTEXTO_INVALIDO;
}
