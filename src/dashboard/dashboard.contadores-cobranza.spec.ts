import { DashboardService } from './dashboard.service';

const SIN_DESINSTALADOS = { not: 'DESINSTALADO' };

describe('DashboardService.getDashboardData: contadores de cobranza', () => {
  it('cuenta pendientes, atrasados y morosos por estadoCobranza, sin desinstalados', async () => {
    const contar = jest.fn((args?: { where?: { estadoCobranza?: string } }) => {
      const porCobranza: Record<string, number> = {
        PAGO_PENDIENTE: 4,
        ATRASADO: 3,
        MOROSO: 2,
      };
      return Promise.resolve(
        porCobranza[args?.where?.estadoCobranza ?? ''] ?? 0,
      );
    });
    const sumar = jest.fn().mockResolvedValue({ _sum: { montoPago: 0 } });
    const prisma = {
      clienteInternet: { count: contar },
      ticketSoporte: {
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
      },
      facturaInternet: {
        count: jest.fn().mockResolvedValue(0),
        aggregate: sumar,
      },
    };

    const datos = await new DashboardService(
      prisma as never,
    ).getDashboardData();

    expect(datos).toMatchObject({
      pendientesPago: 4,
      atrasados: 3,
      delinquentClients: 2,
    });
    expect(contar).toHaveBeenCalledWith({
      where: { estadoCobranza: 'MOROSO', estadoCliente: SIN_DESINSTALADOS },
    });
    // La mora en dinero se suma sobre los mismos clientes.
    const filtrosDeMora = sumar.mock.calls
      .map(([args]) => args.where.cliente)
      .filter(Boolean);
    expect(filtrosDeMora).toEqual([
      { estadoCobranza: 'MOROSO', estadoCliente: SIN_DESINSTALADOS },
      { estadoCobranza: 'MOROSO', estadoCliente: SIN_DESINSTALADOS },
    ]);
  });
});
