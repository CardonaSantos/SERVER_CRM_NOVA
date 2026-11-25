import { TipoOperacionPppoe } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

import { ContextoEliminacionPppoe } from '../enums/contexto-eliminacion-pppoe.enum';
import { resolverContextoEliminacion } from './contexto-eliminacion-pppoe.policy';

const eliminar = (
  instalacionId: number | null,
  desinstalacionId: number | null,
) =>
  resolverContextoEliminacion({
    tipo: TipoOperacionPppoe.ELIMINAR_SECRET,
    instalacionId,
    desinstalacionId,
  });

describe('resolverContextoEliminacion', () => {
  it('devuelve null si la operación no elimina el secret', () => {
    expect(
      resolverContextoEliminacion({
        tipo: TipoOperacionPppoe.SUSPENDER_SERVICIO,
        instalacionId: null,
        desinstalacionId: null,
      }),
    ).toBeNull();
  });

  it('con desinstalación es el flujo formal', () => {
    expect(eliminar(null, 7)).toBe(ContextoEliminacionPppoe.DESINSTALACION);
  });

  it('sin instalación ni desinstalación es baja manual', () => {
    expect(eliminar(null, null)).toBe(ContextoEliminacionPppoe.BAJA_MANUAL);
  });

  it('con instalación es un contexto inválido', () => {
    expect(eliminar(3, null)).toBe(ContextoEliminacionPppoe.CONTEXTO_INVALIDO);
    expect(eliminar(3, 7)).toBe(ContextoEliminacionPppoe.CONTEXTO_INVALIDO);
  });
});
