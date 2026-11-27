import { ClienteNoFacturableError } from '../errors/facturacion.errors';
import { ClienteFacturable } from '../read-models/cliente-facturable.read-model';

export type ClienteListoParaFacturar = ClienteFacturable & {
  empresaId: number;
  zona: NonNullable<ClienteFacturable['zona']>;
  plan: NonNullable<ClienteFacturable['plan']>;
};

/** A quién se le puede generar una factura a mano. */
export function asegurarFacturable(
  cliente: ClienteFacturable,
): ClienteListoParaFacturar {
  const motivo = motivoNoFacturable(cliente);
  if (motivo) throw new ClienteNoFacturableError(motivo);

  return cliente as ClienteListoParaFacturar;
}

function motivoNoFacturable(c: ClienteFacturable): string | null {
  if (c.isEliminado) return 'Cliente eliminado; no se puede facturar.';
  if (c.desinstaladoEn) return 'Cliente desinstalado; no se puede facturar.';
  if (c.estadoCliente !== 'ACTIVO') {
    return `Cliente no facturable. Estado operativo: ${c.estadoCliente}.`;
  }
  if (!c.zona) return 'El cliente no tiene zona de facturación asignada.';
  if (!c.plan) return 'El cliente no tiene servicio de internet asignado.';
  if (c.empresaId === null) return 'El cliente no tiene empresa asociada.';

  return null;
}
