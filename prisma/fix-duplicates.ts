import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1️⃣  Buscar grupos duplicados (cliente + zona + periodo)
  const duplicados = await prisma.$queryRaw<
    { clienteId: number; zona: number | null; periodo: string }[]
  >`SELECT "clienteId",
           "facturacionZonaId" AS "zona",
           "periodo"
      FROM "FacturaInternet"
  GROUP BY 1,2,3
    HAVING COUNT(*) > 1`;

  if (!duplicados.length) {
    console.log('✅ No se encontraron facturas duplicadas.');
    return;
  }

  for (const dup of duplicados) {
    const facturas = await prisma.facturaInternet.findMany({
      where: {
        clienteId: dup.clienteId,
        facturacionZonaId: dup.zona,
        periodo: dup.periodo,
      },
      orderBy: { id: 'asc' }, // primero el más antiguo
      include: { pagos: true },
    });

    // Separar las que tienen pagos
    const conPagos = facturas.filter((f) => f.pagos.length > 0);
    const sinPagos = facturas.filter((f) => f.pagos.length === 0);

    if (conPagos.length > 1) {
      console.warn(
        `⚠️ Cliente ${dup.clienteId} zona ${dup.zona ?? 'NULL'} periodo ${dup.periodo}: ` +
          `${conPagos.length} facturas con pagos. Revisión manual.`,
      );
      continue; // NO tocamos nada
    }

    // Decide cuál conservar:
    //  - Si hay una con pagos, esa es la principal
    //  - Si todas están sin pagos, conservamos la primera (id más bajo)
    const principal = conPagos[0] ?? sinPagos.shift(); // quita la primera de sinPagos
    const aEliminar = [...sinPagos]; // lo que resta sin pagos

    if (aEliminar.length === 0) continue; // nada que eliminar

    // 2️⃣  Eliminar las duplicadas sin pagos
    await prisma.facturaInternet.deleteMany({
      where: { id: { in: aEliminar.map((f) => f.id) } },
    });

    console.log(
      `🗑️  Eliminadas ${aEliminar.length} duplicadas ` +
        `(mantengo ${principal!.id}) para cliente ${dup.clienteId} periodo ${dup.periodo}.`,
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
