import {
  EstadoCliente,
  EstadoCobranzaCliente,
  PrismaClient,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando migración de estados...');

  const resumenAntes = await prisma.clienteInternet.groupBy({
    by: ['estadoCliente'],
    _count: {
      _all: true,
    },
  });

  console.log('Resumen antes:', resumenAntes);

  const resultado = await prisma.$transaction(async (tx) => {
    /**
     * IMPORTANTE:
     * ACTIVO debe ir primero.
     * Si lo pones después, podrías sobreescribir los clientes migrados desde
     * PENDIENTE_ACTIVO / ATRASADO / MOROSO y dejarlos como AL_DIA.
     */
    const activos = await tx.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.ACTIVO,
      },
      data: {
        estadoCliente: EstadoCliente.ACTIVO,
        estadoCobranza: EstadoCobranzaCliente.AL_DIA,
      },
    });

    const pendienteActivo = await tx.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.PENDIENTE_ACTIVO,
      },
      data: {
        estadoCliente: EstadoCliente.ACTIVO,
        estadoCobranza: EstadoCobranzaCliente.PAGO_PENDIENTE,
      },
    });

    /**
     * Defensivo.
     * Aunque dices que PAGO_PENDIENTE no se usa en producción,
     * si existe algún registro flotando, queda normalizado.
     */
    const pagoPendienteLegacy = await tx.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.PAGO_PENDIENTE,
      },
      data: {
        estadoCliente: EstadoCliente.ACTIVO,
        estadoCobranza: EstadoCobranzaCliente.PAGO_PENDIENTE,
      },
    });

    const atrasados = await tx.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.ATRASADO,
      },
      data: {
        estadoCliente: EstadoCliente.ACTIVO,
        estadoCobranza: EstadoCobranzaCliente.ATRASADO,
      },
    });

    const morosos = await tx.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.MOROSO,
      },
      data: {
        estadoCliente: EstadoCliente.ACTIVO,
        estadoCobranza: EstadoCobranzaCliente.MOROSO,
      },
    });

    /**
     * Validación dentro de la misma transacción.
     * Si todavía quedan estados legacy de deuda, algo salió mal.
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
      activos: activos.count,
      pendienteActivo: pendienteActivo.count,
      pagoPendienteLegacy: pagoPendienteLegacy.count,
      atrasados: atrasados.count,
      morosos: morosos.count,
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

  console.log('Migración completada correctamente.');
}

main()
  .catch((error) => {
    console.error('Error migrando estados:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
