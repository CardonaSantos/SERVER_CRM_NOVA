import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import { PrismaTransaccional } from './prisma-transaccional.service';

function armar() {
  const tx = { soy: 'transaccion' };
  const opcionesRecibidas: unknown[] = [];
  const prisma = {
    soy: 'cliente-normal',
    $transaction: jest.fn(
      async (fn: (t: unknown) => Promise<unknown>, opciones?: unknown) => {
        opcionesRecibidas.push(opciones);
        return fn(tx);
      },
    ),
  };
  const unidad = new PrismaTransaccional(prisma as unknown as PrismaService);
  return { unidad, prisma, tx, opcionesRecibidas };
}

describe('PrismaTransaccional', () => {
  it('fuera de una unidad entrega el cliente normal', () => {
    const { unidad, prisma } = armar();

    expect(unidad.cliente).toBe(prisma);
    expect(unidad.enTransaccion).toBe(false);
  });

  it('dentro de una unidad entrega la transacción, también tras un await', async () => {
    const { unidad, tx } = armar();

    const visto = await unidad.ejecutar(async () => {
      await Promise.resolve();
      return unidad.cliente;
    });

    expect(visto).toBe(tx);
    expect(unidad.cliente).not.toBe(tx);
  });

  it('unirseA hace que el trabajo use la transacción abierta por código legacy', async () => {
    const { unidad, prisma, tx } = armar();

    const visto = await unidad.unirseA(
      tx as unknown as Prisma.TransactionClient,
      async () => {
        await Promise.resolve();
        return unidad.cliente;
      },
    );

    expect(visto).toBe(tx);
    expect(unidad.cliente).toBe(prisma);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('una unidad dentro de otra se une a la abierta', async () => {
    const { unidad, prisma, tx } = armar();

    const visto = await unidad.ejecutar(() =>
      unidad.ejecutar(async () => unidad.cliente),
    );

    expect(visto).toBe(tx);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('pide aislamiento Serializable solo cuando se indica', async () => {
    const { unidad, opcionesRecibidas } = armar();

    await unidad.ejecutar(async () => null);
    await unidad.ejecutar(async () => null, { aislamiento: 'SERIALIZABLE' });

    expect(opcionesRecibidas[0]).toBeUndefined();
    expect(opcionesRecibidas[1]).toEqual({ isolationLevel: 'Serializable' });
  });

  it('si el trabajo falla, el error sale de ejecutar', async () => {
    const { unidad } = armar();

    await expect(
      unidad.ejecutar(async () => {
        throw new Error('falla');
      }),
    ).rejects.toThrow('falla');
  });
});
