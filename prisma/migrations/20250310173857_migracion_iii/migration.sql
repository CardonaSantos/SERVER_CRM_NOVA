/*
  Warnings:

  - The values [CRITICA] on the enum `PrioridadTicketSoporte` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `contrasena` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PrioridadTicketSoporte_new" AS ENUM ('BAJA', 'MEDIA', 'ALTA');
ALTER TABLE "TicketSoporte" ALTER COLUMN "prioridad" DROP DEFAULT;
ALTER TABLE "TicketSoporte" ALTER COLUMN "prioridad" TYPE "PrioridadTicketSoporte_new" USING ("prioridad"::text::"PrioridadTicketSoporte_new");
ALTER TYPE "PrioridadTicketSoporte" RENAME TO "PrioridadTicketSoporte_old";
ALTER TYPE "PrioridadTicketSoporte_new" RENAME TO "PrioridadTicketSoporte";
DROP TYPE "PrioridadTicketSoporte_old";
ALTER TABLE "TicketSoporte" ALTER COLUMN "prioridad" SET DEFAULT 'MEDIA';
COMMIT;

-- AlterTable
ALTER TABLE "FacturaInternet" ADD COLUMN     "detalleFactura" TEXT,
ADD COLUMN     "nombreClienteFactura" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "contrasena" TEXT NOT NULL;
