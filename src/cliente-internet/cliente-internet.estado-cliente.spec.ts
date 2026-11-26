import { EstadoCliente, EstadoServicioMikrotik } from '@prisma/client';

import { ClienteInternetService } from './cliente-internet.service';
import { UpdateClienteInternetDto } from './dto/update-cliente-internet.dto';

function crearServicio(prisma: unknown) {
  return new ClienteInternetService(prisma as never, {} as never, {} as never);
}

function crearEdicion(guardado: { desinstaladoEn: Date | null }) {
  const tx = {
    clienteInternet: {
      findUnique: jest.fn().mockResolvedValue({
        id: 7,
        estadoCliente: EstadoCliente.SUSPENDIDO,
        mikrotikRouterId: null,
        estadoServicioMikrotik: EstadoServicioMikrotik.SIN_MIKROTIK,
        IP: null,
        apellidos: 'Pérez',
        ...guardado,
      }),
      update: jest.fn().mockResolvedValue({ id: 7 }),
    },
  };
  const prisma = {
    $transaction: jest.fn((trabajo: (cliente: typeof tx) => unknown) =>
      Promise.resolve(trabajo(tx)),
    ),
  };

  return { service: crearServicio(prisma), tx };
}

const minimo: UpdateClienteInternetDto = { nombre: 'Ana', empresaId: 1 };

const datosGuardados = (tx: { clienteInternet: { update: jest.Mock } }) =>
  tx.clienteInternet.update.mock.calls[0][0].data;

describe('Editar un cliente no pisa lo que no llega', () => {
  it('conserva estado, cobranza, fecha de baja, contacto y servicios', async () => {
    const { service, tx } = crearEdicion({ desinstaladoEn: null });

    await service.updateClienteInternet(7, minimo);

    const data = datosGuardados(tx);
    expect(data.estadoCliente).toBeUndefined();
    expect(data).not.toHaveProperty('estadoCobranza');
    expect(data.desinstaladoEn).toBeUndefined();
    expect(data.telefono).toBeUndefined();
    expect(data.apellidos).toBeUndefined();
    expect(data.clienteServicios).toBeUndefined();
    expect(data.searchNombre).toContain('perez');
  });

  it('ignora la cobranza que envíe el formulario', async () => {
    const { service, tx } = crearEdicion({ desinstaladoEn: null });

    await service.updateClienteInternet(7, {
      ...minimo,
      estadoCobranza: 'AL_DIA',
    });

    expect(datosGuardados(tx)).not.toHaveProperty('estadoCobranza');
  });

  it('un texto vacío sí borra el dato y una lista vacía quita los servicios', async () => {
    const { service, tx } = crearEdicion({ desinstaladoEn: null });

    await service.updateClienteInternet(7, {
      ...minimo,
      telefono: '',
      servicesIds: [],
    });

    expect(datosGuardados(tx).telefono).toBeNull();
    expect(datosGuardados(tx).clienteServicios).toEqual({
      deleteMany: {},
      create: [],
    });
  });

  it('el estado operativo se cambia a mano', async () => {
    const { service, tx } = crearEdicion({ desinstaladoEn: null });

    await service.updateClienteInternet(7, {
      ...minimo,
      estado: EstadoCliente.ACTIVO,
    });

    expect(datosGuardados(tx).estadoCliente).toBe(EstadoCliente.ACTIVO);
    expect(datosGuardados(tx).desinstaladoEn).toBeNull();
  });

  it('desinstalar fija la fecha una sola vez', async () => {
    const primera = crearEdicion({ desinstaladoEn: null });
    await primera.service.updateClienteInternet(7, {
      ...minimo,
      estado: EstadoCliente.DESINSTALADO,
    });
    expect(datosGuardados(primera.tx).desinstaladoEn).toBeInstanceOf(Date);

    const segunda = crearEdicion({
      desinstaladoEn: new Date('2026-01-15T12:00:00Z'),
    });
    await segunda.service.updateClienteInternet(7, {
      ...minimo,
      estado: EstadoCliente.DESINSTALADO,
    });
    expect(datosGuardados(segunda.tx).desinstaladoEn).toBeUndefined();
  });
});

describe('Alta de cliente', () => {
  it('deja la cobranza según la primera factura pendiente', async () => {
    const tx = {
      clienteInternet: {
        create: jest.fn().mockResolvedValue({ id: 9 }),
        update: jest
          .fn()
          .mockResolvedValue({ id: 9, estadoCobranza: 'PAGO_PENDIENTE' }),
      },
      iP: { create: jest.fn() },
      saldoCliente: { create: jest.fn(), update: jest.fn() },
      facturacionZona: {
        findUnique: jest.fn().mockResolvedValue({ id: 2, diaPago: 10 }),
      },
      servicioInternet: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ nombre: 'Plan', velocidad: '10', precio: 200 }),
      },
      facturaInternet: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const prisma = {
      $transaction: jest.fn((trabajo: (cliente: typeof tx) => unknown) =>
        Promise.resolve(trabajo(tx)),
      ),
    };

    const resultado = await crearServicio(prisma).create({
      nombre: 'Ana',
      ip: '',
      servicesIds: [],
      servicioWifiId: 3,
      zonaFacturacionId: 2,
      municipioId: 1,
      departamentoId: 1,
      empresaId: 1,
    });

    expect(tx.clienteInternet.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { estadoCobranza: 'PAGO_PENDIENTE' },
    });
    expect(resultado.cliente.estadoCobranza).toBe('PAGO_PENDIENTE');
  });
});
