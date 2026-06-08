import { Prisma } from '@prisma/client';

export const selectCustomerCampaignWhatsapp =
  Prisma.validator<Prisma.ClienteInternetSelect>()({
    id: true,
    nombre: true,
    apellidos: true,
    telefono: true,
    estadoCliente: true,
    estadoCobranza: true,
    enviarRecordatorio: true,
    contactoReferenciaTelefono: true,
    facturaInternet: {
      where: {
        estadoFacturaInternet: {
          not: 'PAGADA',
        },
      },
    },

    municipio: {
      select: {
        id: true,
        nombre: true,
      },
    },

    sector: {
      select: {
        id: true,
        nombre: true,
      },
    },
  });

export type CustomerCampaignWhatsapp = Prisma.ClienteInternetGetPayload<{
  select: typeof selectCustomerCampaignWhatsapp;
}>;
