// scripts/backfill-search-nombre.ts
import { PrismaClient } from '@prisma/client';

function normalizarTexto(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const prisma = new PrismaClient();

async function main() {
  const batchSize = 500;
  let skip = 0;

  let totalProcesados = 0;
  let totalActualizados = 0;

  while (true) {
    const clientes = await prisma.clienteInternet.findMany({
      skip,
      take: batchSize,
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        searchNombre: true,
      },
      orderBy: { id: 'asc' },
    });

    if (clientes.length === 0) break;

    let batchActualizados = 0;

    for (const c of clientes) {
      const fullName = `${c.nombre ?? ''} ${c.apellidos ?? ''}`.trim();
      const normalizado = normalizarTexto(fullName);

      // si el normalizado está vacío o ya coincide con lo que tiene, no actualizamos
      if (!normalizado || c.searchNombre === normalizado) continue;

      await prisma.clienteInternet.update({
        where: { id: c.id },
        data: { searchNombre: normalizado },
      });

      batchActualizados++;
      totalActualizados++;
    }

    totalProcesados += clientes.length;
    skip += clientes.length;

    console.log(
      `Lote procesado: ${clientes.length} registros. ` +
        `Actualizados en este lote: ${batchActualizados}. ` +
        `Total procesados: ${totalProcesados}. ` +
        `Total actualizados: ${totalActualizados}.`,
    );
  }

  console.log('Backfill de searchNombre completado ✅');
  console.log(`Total de registros procesados: ${totalProcesados}`);
  console.log(`Total de registros actualizados: ${totalActualizados}`);
}

main()
  .catch((err) => {
    console.error('Error en backfill:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
