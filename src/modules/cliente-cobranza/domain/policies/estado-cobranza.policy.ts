import { EstadoCobranzaCliente } from '../../../cliente/public/cliente.types';

/** La cobranza sale de cuántas facturas se deben; nada más la decide. */
export function estadoCobranzaPorPendientes(
  facturasPendientes: number,
): EstadoCobranzaCliente {
  if (facturasPendientes <= 0) return EstadoCobranzaCliente.AL_DIA;
  if (facturasPendientes === 1) return EstadoCobranzaCliente.PAGO_PENDIENTE;
  if (facturasPendientes === 2) return EstadoCobranzaCliente.ATRASADO;

  return EstadoCobranzaCliente.MOROSO;
}
