import { NotFoundException } from '@nestjs/common';
import { StateFacturaInternet } from '@prisma/client';

import { FacturacionService } from './facturacion.service';

/**
 * Facturas y pagos solo cambian la cobranza (`estadoCobranza`). El estado
 * operativo (`estadoCliente`) lo deciden PPPoE y el ajuste manual: cuando una
 * factura lo escribía, el cliente dejaba de facturarse.
 */
function crearEscenario(opciones: { facturasPendientes: number }) {
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
    },
    pagoFacturaInternet: {
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
    saldoCliente: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ clienteId: 7, saldoPendiente: 200 }),
      update: jest.fn(),
    },
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

  it('editar una factura guarda todo en una sola transacción y ajusta el saldo como antes', async () => {
    const { service, tx, prisma } = crearEscenario({ facturasPendientes: 1 });

    await service.updateFactura(10, {
      montoPago: 150,
      estadoFacturaInternet: StateFacturaInternet.PENDIENTE,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.saldoCliente.update).toHaveBeenCalledWith({
      where: { clienteId: 7 },
      data: { saldoPendiente: 150 },
    });
  });

  it('anular una factura descuenta su saldo del saldo del cliente', async () => {
    const { service, tx } = crearEscenario({ facturasPendientes: 0 });

    await service.updateFactura(10, {
      montoPago: 200,
      estadoFacturaInternet: StateFacturaInternet.ANULADA,
    });

    expect(tx.saldoCliente.update).toHaveBeenCalledWith({
      where: { clienteId: 7 },
      data: { saldoPendiente: 0 },
    });
  });

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
    tx.saldoCliente.update.mockRejectedValue(new Error('fallo de base'));

    await expect(service.updateFactura(10, { montoPago: 150 })).rejects.toThrow(
      'fallo de base',
    );
  });
});
