/*
  Warnings:

  - Added the required column `cobradorId` to the `PagoFacturaInternet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PagoFacturaInternet" ADD COLUMN     "cobradorId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "PagoFacturaInternet" ADD CONSTRAINT "PagoFacturaInternet_cobradorId_fkey" FOREIGN KEY ("cobradorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
