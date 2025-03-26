/*
  Warnings:

  - A unique constraint covering the columns `[numeroBoleta]` on the table `PagoFacturaInternet` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PagoFacturaInternet" ADD COLUMN     "numeroBoleta" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PagoFacturaInternet_numeroBoleta_key" ON "PagoFacturaInternet"("numeroBoleta");
