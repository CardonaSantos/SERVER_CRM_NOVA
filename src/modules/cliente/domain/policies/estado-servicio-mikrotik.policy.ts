import { EstadoServicioMikrotik } from '../enums/estado-servicio-mikrotik.enum';

/**
 * Cómo queda la marca del router al cambiar la asignación: sin router no hay
 * nada que aplicar; un router nuevo (o uno sin marca) queda pendiente.
 */
export function resolverEstadoServicioMikrotik(params: {
  routerAnterior: number | null;
  routerNuevo: number | null;
  estadoActual: EstadoServicioMikrotik;
}): EstadoServicioMikrotik {
  const { routerAnterior, routerNuevo, estadoActual } = params;

  if (routerNuevo === null) {
    return routerAnterior === null
      ? estadoActual
      : EstadoServicioMikrotik.SIN_MIKROTIK;
  }

  const sinAplicar =
    routerAnterior !== routerNuevo ||
    estadoActual === EstadoServicioMikrotik.SIN_MIKROTIK;

  return sinAplicar ? EstadoServicioMikrotik.PENDIENTE_APLICAR : estadoActual;
}
