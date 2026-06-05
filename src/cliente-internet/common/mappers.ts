import { EstadoCliente, EstadoCobranzaCliente } from '@prisma/client';
import { CustomerCampaignWhatsapp } from '../select/select-customer';

export function mapCustomersCampaingWhatsapp(
  array: Array<CustomerCampaignWhatsapp>,
) {
  if (!array.length) {
    return [];
  }

  return array.map((c) => {
    const estado = c.estadoCliente;
    const estadoCobranza = c.estadoCobranza;
    const facturasPendientes = c.facturaInternet.length;

    return {
      id: c.id,
      nombre: `${c.nombre ?? ''} ${c.apellidos ?? ''}`,
      facturasPendientes: facturasPendientes,
      estado: estado,
      estadoCobranza: estadoCobranza,
      telefono: c.telefono,
      telefonoRef: c.contactoReferenciaTelefono,
    };
  });
}
