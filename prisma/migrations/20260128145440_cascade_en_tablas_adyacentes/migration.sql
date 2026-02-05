-- DropForeignKey
ALTER TABLE "public"."CreditoContrato" DROP CONSTRAINT "CreditoContrato_creditoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CreditoEstadoHistorial" DROP CONSTRAINT "CreditoEstadoHistorial_creditoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PagoCredito" DROP CONSTRAINT "PagoCredito_creditoId_fkey";

-- AddForeignKey
ALTER TABLE "PagoCredito" ADD CONSTRAINT "PagoCredito_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "Credito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditoEstadoHistorial" ADD CONSTRAINT "CreditoEstadoHistorial_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "Credito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditoContrato" ADD CONSTRAINT "CreditoContrato_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "Credito"("id") ON DELETE CASCADE ON UPDATE CASCADE;
