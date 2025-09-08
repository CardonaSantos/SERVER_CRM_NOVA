import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Opcional: “dry-run” para ver qué cambiaría (no modifica nada)
  const preview = await prisma.$queryRawUnsafe<
    Array<{
      id: number;
      montoPago: number | null;
      pagado: number | null;
      saldoActual: number | null;
      saldoNuevo: number;
    }>
  >(`
    WITH pagos AS (
      SELECT "facturaInternetId", COALESCE(SUM("montoPagado"),0) AS pagado
      FROM "PagoFacturaInternet"
      GROUP BY "facturaInternetId"
    )
    SELECT f.id,
           COALESCE(f."montoPago",0) AS "montoPago",
           COALESCE(p.pagado,0)       AS "pagado",
           COALESCE(f."saldoPendiente",0) AS "saldoActual",
           GREATEST(COALESCE(f."montoPago",0) - COALESCE(p.pagado,0), 0) AS "saldoNuevo"
    FROM "FacturaInternet" f
    LEFT JOIN pagos p ON p."facturaInternetId" = f.id
    LIMIT 20
  `);

  console.log('Preview (primeras 20 filas):');
  console.table(preview);

  // Backfill real
  const result = await prisma.$transaction(async (tx) => {
    // 1) Facturas con pagos: saldo = montoPago - sum(pagos)
    const updatedWithPayments = await tx.$executeRawUnsafe(`
      WITH pagos AS (
        SELECT "facturaInternetId", COALESCE(SUM("montoPagado"),0) AS pagado
        FROM "PagoFacturaInternet"
        GROUP BY "facturaInternetId"
      )
      UPDATE "FacturaInternet" f
      SET "saldoPendiente" = GREATEST(COALESCE(f."montoPago",0) - COALESCE(p.pagado,0), 0)
      FROM pagos p
      WHERE f.id = p."facturaInternetId"
    `);

    // 2) Facturas sin pagos: saldo = montoPago
    const updatedWithoutPayments = await tx.$executeRawUnsafe(`
      UPDATE "FacturaInternet" f
      SET "saldoPendiente" = COALESCE(f."montoPago",0)
      WHERE NOT EXISTS (
        SELECT 1 FROM "PagoFacturaInternet" p
        WHERE p."facturaInternetId" = f.id
      )
    `);

    return { updatedWithPayments, updatedWithoutPayments };
  });

  console.log('Filas actualizadas (con pagos):', result.updatedWithPayments);
  console.log('Filas actualizadas (sin pagos):', result.updatedWithoutPayments);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
