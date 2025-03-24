-- DropForeignKey
ALTER TABLE "RecordatorioPago" DROP CONSTRAINT "RecordatorioPago_facturaInternetId_fkey";

-- AddForeignKey
ALTER TABLE "RecordatorioPago" ADD CONSTRAINT "RecordatorioPago_facturaInternetId_fkey" FOREIGN KEY ("facturaInternetId") REFERENCES "FacturaInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
