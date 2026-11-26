import { ClienteInternetService } from './cliente-internet.service';

describe('Tabla de clientes: resumen de cobranza', () => {
  it('cuenta la cobranza por estadoCobranza y los activos por estado operativo', async () => {
    const porFiltro: Record<string, number> = {
      ACTIVO: 10,
      PAGO_PENDIENTE: 4,
      ATRASADO: 3,
      MOROSO: 2,
    };
    const contar = jest.fn(
      (args?: {
        where?: { estadoCliente?: unknown; estadoCobranza?: string };
      }) => {
        const clave =
          args?.where?.estadoCobranza ?? String(args?.where?.estadoCliente);
        return Promise.resolve(porFiltro[clave] ?? 0);
      },
    );
    const prisma = {
      clienteInternet: {
        findMany: jest.fn().mockResolvedValue([]),
        count: contar,
      },
      $transaction: jest.fn((consultas: Promise<unknown>[]) =>
        Promise.all(consultas),
      ),
    };

    const service = new ClienteInternetService(
      prisma as never,
      {} as never,
      {} as never,
    );

    const resultado = await service.findCustomersToTable({
      page: 1,
      limite: 10,
    } as never);

    expect(resultado.summary).toEqual({
      activo: 10,
      pendiente_activo: 4,
      atrasado: 3,
      moroso: 2,
    });
    expect(contar).toHaveBeenCalledWith({
      where: {
        estadoCobranza: 'MOROSO',
        estadoCliente: { not: 'DESINSTALADO' },
      },
    });
  });
});
