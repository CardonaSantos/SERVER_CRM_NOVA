/*
  Warnings:

  - The values [TRANSFERENCIA] on the enum `MetodoPagoFacturaInternet` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MetodoPagoFacturaInternet_new" AS ENUM ('EFECTIVO', 'TARJETA', 'DEPOSITO', 'PAYPAL', 'PENDIENTE', 'OTRO');
ALTER TABLE "FacturaInternet" ALTER COLUMN "metodoPago" TYPE "MetodoPagoFacturaInternet_new" USING ("metodoPago"::text::"MetodoPagoFacturaInternet_new");
ALTER TABLE "PagoFacturaInternet" ALTER COLUMN "metodoPago" TYPE "MetodoPagoFacturaInternet_new" USING ("metodoPago"::text::"MetodoPagoFacturaInternet_new");
ALTER TYPE "MetodoPagoFacturaInternet" RENAME TO "MetodoPagoFacturaInternet_old";
ALTER TYPE "MetodoPagoFacturaInternet_new" RENAME TO "MetodoPagoFacturaInternet";
DROP TYPE "MetodoPagoFacturaInternet_old";
COMMIT;
