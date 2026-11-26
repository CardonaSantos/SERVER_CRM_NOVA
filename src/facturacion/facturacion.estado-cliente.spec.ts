import { NotFoundException } from '@nestjs/common';
import { StateFacturaInternet } from '@prisma/client';

import { FacturacionService } from './facturacion.service';

/**
 * Facturas y pagos solo cambian la cobranza (`estadoCobranza`). El estado
 * operativo (`estadoCliente`) lo deciden PPPoE y el ajuste manual: cuando una
 * factura lo escribía, el cliente dejaba de facturarse.
 */
function crearEscenario(opciones: {
  facturasPendientes: number;
  pagado?: number;
}) {
  const factura = {
    id: 10,
    clienteId: 7,
    montoPago: 200,
    saldoPendiente: 200,
    fechaPagada: null,
    estadoFacturaInternet: StateFacturaInternet.PENDIENTE,
  };

  const tx = {
    facturaInternet: {
      findUnique: jest.fn().mockResolvedValue(factura),
      update: jest.fn().mockResolvedValue({ ...factura, montoPago: 150 }),
      count: jest.fn().mockResolvedValue(opciones.facturasPendientes),
      findMany: jest
        .fn()
        .mockResolvedValue([{ saldoPendiente: 80 }, { saldoPendiente: 45 }]),
    },
    pagoFacturaInternet: {
      aggregate: jest
        .fn()
        .mockResolvedValue({ _sum: { montoPagado: opciones.pagado ?? null } }),
      findUnique: jest.fn().mockResolvedValue({
        id: 3,
        montoPagado: 200,
        fechaPago: new Date('2026-11-01T12:00:00Z'),
        clienteId: 7,
        facturaInternetId: 10,
      }),
      findFirst: jest.fn().mockResolvedValue(null),
      delete: jest.fn(),
    },
    saldoCliente: { updateMany: jest.fn() },
    clienteInternet: { update: jest.fn() },
  };

  const prisma = {
    $transaction: jest.fn((trabajo: (cliente: typeof tx) => unknown) =>
      Promise.resolve(trabajo(tx)),
    ),
  };

  const service = new FacturacionService(
    prisma as never,
    {} as never,
    {} as never,
  );

  return { service, tx, prisma };
}

const datosEscritosEnCliente = (tx: {
  clienteInternet: { update: jest.Mock };
}) => tx.clienteInternet.update.mock.calls.map(([args]) => args.data);

describe('FacturacionService: estado del cliente', () => {
  const casos = [
    [0, 'AL_DIA'],
    [1, 'PAGO_PENDIENTE'],
    [2, 'ATRASADO'],
    [3, 'MOROSO'],
    [8, 'MOROSO'],
  ] as const;

  it.each(casos)(
    'editar una factura con %i pendientes deja la cobranza en %s sin tocar el estado operativo',
    async (facturasPendientes, estadoCobranza) => {
      const { service, tx } = crearEscenario({ facturasPendientes });

      await service.updateFactura(10, {
        montoPago: 150,
        estadoFacturaInternet: StateFacturaInternet.PENDIENTE,
      });

      expect(datosEscritosEnCliente(tx)).toEqual([{ estadoCobranza }]);
    },
  );

  it.each(casos)(
    'eliminar un pago con %i pendientes deja la cobranza en %s sin tocar el estado operativo',
    async (facturasPendientes, estadoCobranza) => {
      const { service, tx } = crearEscenario({ facturasPendientes });

      await expect(service.deleteOnePayment(3)).resolves.toEqual({ ok: true });

      expect(datosEscritosEnCliente(tx)).toEqual([{ estadoCobranza }]);
    },
  );

  it.each([
    ['sin pagos', 'PENDIENTE', undefined, 150],
    ['con un abono', 'PARCIAL', 100, 50],
    ['pagada por completo', 'PAGADA', 150, 0],
    ['marcada pagada a mano', 'PAGADA', undefined, 0],
    ['anulada', 'ANULADA', undefined, 0],
    ['con pagos mayores al monto', 'PENDIENTE', 500, 0],
  ] as const)(
    'editar una factura %s deja su saldo según lo pagado',
    async (_caso, estado, pagado, saldoPendiente) => {
      const { service, tx, prisma } = crearEscenario({
        facturasPendientes: 1,
        pagado,
      });

      await service.updateFactura(10, {
        montoPago: 150,
        estadoFacturaInternet: StateFacturaInternet[estado],
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.facturaInternet.update.mock.calls[0][0].data).toMatchObject({
        saldoPendiente,
      });
    },
  );

  it.each(['editar', 'eliminar'])(
    '%s recalcula el saldo del cliente desde sus facturas, sin sumar ni restar',
    async (accion) => {
      const { service, tx } = crearEscenario({ facturasPendientes: 2 });

      await (accion === 'editar'
        ? service.updateFactura(10, { montoPago: 150 })
        : service.deleteOnePayment(3));

      expect(tx.saldoCliente.updateMany).toHaveBeenCalledWith({
        where: { clienteId: 7 },
        data: { saldoPendiente: 125 },
      });
    },
  );

  it('una factura inexistente responde 404 y no escribe nada', async () => {
    const { service, tx } = crearEscenario({ facturasPendientes: 0 });
    tx.facturaInternet.findUnique.mockResolvedValue(null);

    await expect(service.updateFactura(99, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(tx.facturaInternet.update).not.toHaveBeenCalled();
    expect(tx.clienteInternet.update).not.toHaveBeenCalled();
  });

  it('si falla un guardado, el error sale en vez de responder éxito', async () => {
    const { service, tx } = crearEscenario({ facturasPendientes: 0 });
    tx.saldoCliente.updateMany.mockRejectedValue(new Error('fallo de base'));

    await expect(service.updateFactura(10, { montoPago: 150 })).rejects.toThrow(
      'fallo de base',
    );
  });
});
