import { EstadoCobranzaCliente } from '../../../cliente/public/cliente.types';
import { estadoCobranzaPorPendientes } from './estado-cobranza.policy';

describe('estadoCobranzaPorPendientes', () => {
  it.each([
    [0, EstadoCobranzaCliente.AL_DIA],
    [1, EstadoCobranzaCliente.PAGO_PENDIENTE],
    [2, EstadoCobranzaCliente.ATRASADO],
    [3, EstadoCobranzaCliente.MOROSO],
    [12, EstadoCobranzaCliente.MOROSO],
  ])('%i facturas pendientes: %s', (pendientes, estado) => {
    expect(estadoCobranzaPorPendientes(pendientes)).toBe(estado);
  });
});
