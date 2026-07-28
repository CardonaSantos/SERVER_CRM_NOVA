import { Prisma } from '@prisma/client';

export const SelectMikrotik = {
  id: true,
  host: true,
  sshPort: true,
  activo: true,
  descripcion: true,
  _count: {
    select: {
      clientesInternet: true,
    },
  },
  empresa: {
    select: {
      id: true,
    },
  },
  nombre: true,
  olt: {
    select: {
      id: true,
      nombre: true,
    },
  },
  usuario: true,
  actualizadoEn: true,
  creadoEn: true,
} satisfies Prisma.MikrotikRouterSelect;

export type MikrotikRow = Prisma.MikrotikRouterGetPayload<{
  select: typeof SelectMikrotik;
}>;

export type MikrotikSelect = MikrotikRow[];
