import { Prisma } from '@prisma/client';

export const selectClienteInternetReport: Prisma.ClienteInternetSelect = {
  id: true,

  nombre: true,
  apellidos: true,

  dpi: true,

  telefono: true,
  contactoReferenciaNombre: true,
  contactoReferenciaTelefono: true,

  estadoCliente: true,
  estadoCobranza: true,

  servicioInternetId: true,

  ubicacion: {
    select: {
      latitud: true,
      longitud: true,
    },
  },

  servicioInternet: {
    select: {
      nombre: true,
    },
  },

  fechaInstalacion: true,

  sector: {
    select: {
      nombre: true,
    },
  },

  municipio: {
    select: {
      nombre: true,
    },
  },

  departamento: {
    select: {
      nombre: true,
    },
  },

  direccion: true,

  enviarRecordatorio: true,
  whatsappActivo: true,

  observaciones: true,
  nota: true,

  isEliminado: true,
  desinstaladoEn: true,

  creadoEn: true,
  actualizadoEn: true,

  _count: {
    select: {
      ticketSoporte: true,
      instalaciones: true,
      desinstalaciones: true,
    },
  },
};

export type ClienteReportePrismaResult = Prisma.ClienteInternetGetPayload<{
  select: typeof selectClienteInternetReport;
}>;
