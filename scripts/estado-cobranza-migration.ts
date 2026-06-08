import {
  EstadoCliente,
  EstadoCobranzaCliente,
  PrismaClient,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.ACTIVO,
      },
      data: {
        estadoCobranza: EstadoCobranzaCliente.AL_DIA,
        estadoCliente: EstadoCliente.ACTIVO,
      },
    }),

    prisma.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.PENDIENTE_ACTIVO,
      },
      data: {
        estadoCobranza: EstadoCobranzaCliente.PAGO_PENDIENTE,
        estadoCliente: EstadoCliente.ACTIVO,
      },
    }),

    prisma.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.ATRASADO,
      },
      data: {
        estadoCobranza: EstadoCobranzaCliente.ATRASADO,
        estadoCliente: EstadoCliente.ACTIVO,
      },
    }),

    prisma.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.MOROSO,
      },
      data: {
        estadoCobranza: EstadoCobranzaCliente.MOROSO,
        estadoCliente: EstadoCliente.ACTIVO,
      },
    }),

    prisma.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.SUSPENDIDO,
      },
      data: {
        estadoCliente: EstadoCliente.SUSPENDIDO,
      },
    }),

    prisma.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.DESINSTALADO,
      },
      data: {
        estadoCliente: EstadoCliente.DESINSTALADO,
      },
    }),

    prisma.clienteInternet.updateMany({
      where: {
        estadoCliente: EstadoCliente.EN_INSTALACION,
      },
      data: {
        estadoCliente: EstadoCliente.EN_INSTALACION,
      },
    }),
  ]);

  console.log('Migración completada');
}

main()
  .catch((error) => {
    console.error('Error migrando estados:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
