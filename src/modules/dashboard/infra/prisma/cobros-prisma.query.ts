import { Injectable } from '@nestjs/common';
import {
  EstadoCliente,
  EstadoRuta,
  StateFacturaInternet,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CobrosQueryPort } from '../../domain/ports/cobros-query.port';
import { CobrosDashboardReadModel } from '../../domain/read-models/cobros.read-model';

const SIN_PAGAR = [
  StateFacturaInternet.PENDIENTE,
  StateFacturaInternet.VENCIDA,
  StateFacturaInternet.PARCIAL,
];

const RUTAS_ABIERTAS = [
  EstadoRuta.ACTIVO,
  EstadoRuta.ASIGNADA,
  EstadoRuta.EN_CURSO,
];

@Injectable()
export class CobrosPrismaQuery implements CobrosQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findResumen(limite: number): Promise<CobrosDashboardReadModel> {
    const [deudores, rutas] = await Promise.all([
      this.prisma.facturaInternet.groupBy({
        by: ['clienteId'],
        where: {
          estadoFacturaInternet: { in: SIN_PAGAR },
          cliente: {
            isEliminado: false,
            estadoCliente: { not: EstadoCliente.DESINSTALADO },
          },
        },
        _count: { id: true },
        orderBy: [{ _count: { id: 'desc' } }, { clienteId: 'asc' }],
        take: limite,
      }),
      this.prisma.ruta.findMany({
        where: { eliminadoEn: null, estadoRuta: { in: RUTAS_ABIERTAS } },
        orderBy: { actualizadoEn: 'desc' },
        take: limite,
        select: {
          id: true,
          nombreRuta: true,
          cobrador: { select: { nombre: true } },
          _count: {
            select: { clientes: { where: { isEliminado: false } } },
          },
        },
      }),
    ]);

    const ids = deudores.flatMap((d) =>
      d.clienteId === null ? [] : [d.clienteId],
    );
    const clientes = await this.prisma.clienteInternet.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true, apellidos: true },
    });
    const nombres = new Map(
      clientes.map((c) => [
        c.id,
        [c.nombre, c.apellidos].filter(Boolean).join(' ').trim(),
      ]),
    );

    return {
      morosoTop: deudores.flatMap((d) =>
        d.clienteId === null
          ? []
          : [
              {
                id: d.clienteId,
                nombre: nombres.get(d.clienteId) || `Cliente #${d.clienteId}`,
                cantidad: d._count.id,
              },
            ],
      ),
      rutasActiva: rutas.map((r) => ({
        id: r.id,
        nombreRuta: r.nombreRuta || `Ruta #${r.id}`,
        cobrador: r.cobrador?.nombre ?? null,
        totalClientes: r._count.clientes,
      })),
    };
  }
}
