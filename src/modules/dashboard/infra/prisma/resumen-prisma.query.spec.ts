import { PrismaService } from 'src/prisma/prisma.service';
import { ResumenPrismaQuery } from './resumen-prisma.query';

describe('ResumenPrismaQuery', () => {
  it('cobranza sin desinstalados y facturas sin anuladas', async () => {
    const agrupar = jest.fn().mockResolvedValue([]);
    const contarFacturas = jest.fn().mockResolvedValue(0);
    const prisma = {
      clienteInternet: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: agrupar,
      },
      facturaInternet: {
        count: contarFacturas,
        aggregate: jest.fn().mockResolvedValue({ _sum: {} }),
      },
      pagoFacturaInternet: {
        aggregate: jest.fn().mockResolvedValue({ _sum: {} }),
      },
    };

    await new ResumenPrismaQuery(prisma as unknown as PrismaService).findDatos({
      desde: '2026-11-01',
      hastaExclusivo: '2026-12-01',
    });

    expect(agrupar).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['estadoCobranza'],
        where: {
          isEliminado: false,
          estadoCliente: { not: 'DESINSTALADO' },
        },
      }),
    );
    expect(contarFacturas).toHaveBeenCalledWith({
      where: {
        creadoEn: {
          gte: new Date('2026-11-01T06:00:00.000Z'),
          lt: new Date('2026-12-01T06:00:00.000Z'),
        },
        estadoFacturaInternet: { not: 'ANULADA' },
      },
    });
  });
});
