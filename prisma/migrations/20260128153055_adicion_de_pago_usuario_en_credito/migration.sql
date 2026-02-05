-- DropForeignKey
ALTER TABLE "public"."Credito" DROP CONSTRAINT "Credito_clienteId_fkey";

-- AlterTable
ALTER TABLE "PagoCredito" ADD COLUMN     "registradoPorId" INTEGER;

-- AddForeignKey
ALTER TABLE "Credito" ADD CONSTRAINT "Credito_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCredito" ADD CONSTRAINT "PagoCredito_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
