import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { FotoMensualCarteraQueryPort } from '../../domain/ports/foto-mensual-cartera-query.port';
import { FotoMensualCarteraReadModel } from '../../domain/read-models/evolucion-cartera.read-model';

@Injectable()
export class FotoMensualCarteraPrismaQuery
  implements FotoMensualCarteraQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  findDeMeses(
    meses: readonly string[],
  ): Promise<FotoMensualCarteraReadModel[]> {
    return this.prisma.fotoMensualCartera.findMany({
      where: { mes: { in: [...meses] } },
      orderBy: { mes: 'asc' },
      select: {
        mes: true,
        tomadaEn: true,
        totalClientes: true,
        activos: true,
        suspendidos: true,
        pendientesActivacion: true,
        enInstalacion: true,
        desinstalados: true,
        alDia: true,
        pagoPendiente: true,
        atrasados: true,
        morosos: true,
        facturasConDeuda: true,
        clientesConDeuda: true,
        clientesConDeudaVencida: true,
        deuda: true,
        deudaVencida: true,
        deudaDesinstalados: true,
      },
    });
  }
}
