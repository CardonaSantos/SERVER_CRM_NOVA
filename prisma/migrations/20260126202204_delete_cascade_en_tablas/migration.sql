-- DropForeignKey
ALTER TABLE "public"."Credito" DROP CONSTRAINT "Credito_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CreditoContrato" DROP CONSTRAINT "CreditoContrato_creditoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CreditoEstadoHistorial" DROP CONSTRAINT "CreditoEstadoHistorial_creditoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CuotaCredito" DROP CONSTRAINT "CuotaCredito_creditoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MoraCredito" DROP CONSTRAINT "MoraCredito_cuotaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PagoCredito" DROP CONSTRAINT "PagoCredito_creditoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PagoCuota" DROP CONSTRAINT "PagoCuota_cuotaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PagoCuota" DROP CONSTRAINT "PagoCuota_pagoCreditoId_fkey";

-- AddForeignKey
ALTER TABLE "Credito" ADD CONSTRAINT "Credito_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuotaCredito" ADD CONSTRAINT "CuotaCredito_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "Credito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCuota" ADD CONSTRAINT "PagoCuota_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "CuotaCredito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCuota" ADD CONSTRAINT "PagoCuota_pagoCreditoId_fkey" FOREIGN KEY ("pagoCreditoId") REFERENCES "PagoCredito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCredito" ADD CONSTRAINT "PagoCredito_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "Credito"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditoEstadoHistorial" ADD CONSTRAINT "CreditoEstadoHistorial_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "Credito"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoraCredito" ADD CONSTRAINT "MoraCredito_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "CuotaCredito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditoContrato" ADD CONSTRAINT "CreditoContrato_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "Credito"("id") ON DELETE SET NULL ON UPDATE CASCADE;
