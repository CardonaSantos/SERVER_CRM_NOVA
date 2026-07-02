import {
  EstadoCliente,
  EstadoCobranzaCliente,
  PrismaClient,
  StateFacturaInternet,
} from '@prisma/client';

const prisma = new PrismaClient();

const ESTADOS_FACTURA_PENDIENTE: StateFacturaInternet[] = [
  StateFacturaInternet.PENDIENTE,
  StateFacturaInternet.PARCIAL,
  StateFacturaInternet.VENCIDA,
];

function getEstadoCobranza(pendientes: number): EstadoCobranzaCliente {
  if (pendientes <= 0) return EstadoCobranzaCliente.AL_DIA;
  if (pendientes === 1) return EstadoCobranzaCliente.PAGO_PENDIENTE;
  if (pendientes === 2) return EstadoCobranzaCliente.ATRASADO;
  return EstadoCobranzaCliente.MOROSO;
}

function chunk<T>(items: T[], size = 500): T[][] {
  const result: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }

  return result;
}

async function main() {
  console.log('Iniciando migración idempotente de estados...');

  const resumenAntesEstadoCliente = await prisma.clienteInternet.groupBy({
    by: ['estadoCliente'],
    _count: {
      _all: true,
    },
  });

  const resumenAntesEstadoCobranza = await prisma.clienteInternet.groupBy({
    by: ['estadoCobranza'],
    _count: {
      _all: true,
    },
  });

  console.log('Resumen antes estadoCliente:', resumenAntesEstadoCliente);
  console.log('Resumen antes estadoCobranza:', resumenAntesEstadoCobranza);

  const resultado = await prisma.$transaction(async (tx) => {
    /**
     * 1. Normalizar estados legacy.
     * Aquí NO tocamos los clientes que ya están ACTIVO.
     * Esto hace que el script sea seguro para correr más de una vez.
     */
    const pendienteActivo = await tx.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.PENDIENTE_ACTIVO,
      },
      data: {
        estadoCliente: EstadoCliente.ACTIVO,
      },
    });

    const pagoPendienteLegacy = await tx.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.PAGO_PENDIENTE,
      },
      data: {
        estadoCliente: EstadoCliente.ACTIVO,
      },
    });

    const atrasadosLegacy = await tx.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.ATRASADO,
      },
      data: {
        estadoCliente: EstadoCliente.ACTIVO,
      },
    });

    const morososLegacy = await tx.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.MOROSO,
      },
      data: {
        estadoCliente: EstadoCliente.ACTIVO,
      },
    });

    /**
     * 2. Traer todos los clientes.
     */
    const clientes = await tx.clienteInternet.findMany({
      select: {
        id: true,
      },
    });

    /**
     * 3. Contar facturas pendientes por cliente.
     */
    const pendientesPorCliente = await tx.facturaInternet.groupBy({
      by: ['clienteId'],
      where: {
        estadoFacturaInternet: {
          in: ESTADOS_FACTURA_PENDIENTE,
        },
      },
      _count: {
        _all: true,
      },
    });

    const pendientesMap = new Map<number, number>();

    for (const item of pendientesPorCliente) {
      pendientesMap.set(item.clienteId, item._count._all);
    }

    const idsPorEstado: Record<EstadoCobranzaCliente, number[]> = {
      [EstadoCobranzaCliente.AL_DIA]: [],
      [EstadoCobranzaCliente.PAGO_PENDIENTE]: [],
      [EstadoCobranzaCliente.ATRASADO]: [],
      [EstadoCobranzaCliente.MOROSO]: [],
    };

    for (const cliente of clientes) {
      const pendientes = pendientesMap.get(cliente.id) ?? 0;
      const estadoCobranza = getEstadoCobranza(pendientes);

      idsPorEstado[estadoCobranza].push(cliente.id);
    }

    /**
     * 4. Actualizar estadoCobranza por bloques.
     */
    for (const [estadoCobranza, ids] of Object.entries(idsPorEstado) as [
      EstadoCobranzaCliente,
      number[],
    ][]) {
      for (const idsChunk of chunk(ids)) {
        if (idsChunk.length === 0) continue;

        await tx.clienteInternet.updateMany({
          where: {
            id: {
              in: idsChunk,
            },
          },
          data: {
            estadoCobranza,
          },
        });
      }
    }

    /**
     * 5. Validar que ya no queden estados legacy en estadoCliente.
     */
    const legacyRestantes = await tx.clienteInternet.count({
      where: {
        estadoCliente: {
          in: [
            EstadoCliente.PENDIENTE_ACTIVO,
            EstadoCliente.PAGO_PENDIENTE,
            EstadoCliente.ATRASADO,
            EstadoCliente.MOROSO,
          ],
        },
      },
    });

    if (legacyRestantes > 0) {
      throw new Error(
        `Migración inválida: quedaron ${legacyRestantes} clientes con estados legacy.`,
      );
    }

    return {
      normalizados: {
        pendienteActivo: pendienteActivo.count,
        pagoPendienteLegacy: pagoPendienteLegacy.count,
        atrasadosLegacy: atrasadosLegacy.count,
        morososLegacy: morososLegacy.count,
      },
      cobranza: {
        alDia: idsPorEstado[EstadoCobranzaCliente.AL_DIA].length,
        pagoPendiente:
          idsPorEstado[EstadoCobranzaCliente.PAGO_PENDIENTE].length,
        atrasado: idsPorEstado[EstadoCobranzaCliente.ATRASADO].length,
        moroso: idsPorEstado[EstadoCobranzaCliente.MOROSO].length,
      },
    };
  });

  console.log('Resultado migración:', resultado);

  const resumenDespuesEstadoCliente = await prisma.clienteInternet.groupBy({
    by: ['estadoCliente'],
    _count: {
      _all: true,
    },
  });

  const resumenDespuesEstadoCobranza = await prisma.clienteInternet.groupBy({
    by: ['estadoCobranza'],
    _count: {
      _all: true,
    },
  });

  console.log('Resumen después estadoCliente:', resumenDespuesEstadoCliente);
  console.log('Resumen después estadoCobranza:', resumenDespuesEstadoCobranza);

  console.log('Migración idempotente completada correctamente.');
}

main()
  .catch((error) => {
    console.error('Error migrando estados:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
