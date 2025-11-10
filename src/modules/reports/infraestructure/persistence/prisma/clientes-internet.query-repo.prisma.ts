// src/modules/reports/infrastructure/persistence/prisma/clientes-internet.query-repo.prisma.ts
import { Injectable } from '@nestjs/common';
import { ClientesInternetQueryRepo } from 'src/modules/reports/domain/repositories/clientes-internet.query-repo';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClientesInternetQueryRepoPrisma
  implements ClientesInternetQueryRepo
{
  constructor(private readonly prisma: PrismaService) {}

  async findClientes(params: {
    desde?: Date;
    hasta?: Date;
    sectorId?: number;
    planId?: number;
    activos?: boolean;
  }) {
    const rows = await this.prisma.clienteInternet.findMany({
      where: {
        // si tienes “activo” en tu schema, úsalo:
        // ...(params.activos !== undefined ? { activo: params.activos } : {}),
        ...(params.sectorId ? { sectorId: params.sectorId } : {}),
        ...(params.planId ? { servicioInternetId: params.planId } : {}),
        ...(params.desde || params.hasta
          ? {
              fechaInstalacion: {
                ...(params.desde ? { gte: params.desde } : {}),
                ...(params.hasta ? { lte: params.hasta } : {}),
              },
            }
          : {}),
      },
      select: {
        id: true, // <- normalmente Int
        nombre: true,
        apellidos: true,
        telefono: true,
        fechaInstalacion: true,
        estadoCliente: true, // <- enum de Prisma
        servicioInternet: { select: { id: true, nombre: true } },
        facturaInternet: {
          where: { estadoFacturaInternet: 'PAGADA' },
          select: { montoPago: true, pagos: true }, // asegúrate que pagos tiene montoPagado
        },
      },
    });

    return rows.map((r) => {
      const saldo = r.facturaInternet.reduce(
        (acc, fac) =>
          acc + fac.pagos.reduce((acc2, p) => acc2 + (p.montoPagado ?? 0), 0),
        0,
      );

      return {
        id: String(r.id), // <— normaliza a string
        nombre: `${r.nombre ?? ''} ${r.apellidos ?? ''}`.trim(),
        telefono: r.telefono ?? null,
        fechaAlta: r.fechaInstalacion,
        plan: r.servicioInternet?.nombre ?? '',
        estado: String(r.estadoCliente), // <— enum → string
        saldo,
      };
    });
  }
}
