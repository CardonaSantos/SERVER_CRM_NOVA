-- AlterTable
ALTER TABLE "ClientePppoeCuenta" ADD COLUMN     "adoptadoEn" TIMESTAMP(3),
ADD COLUMN     "adoptadoPorId" INTEGER;

-- CreateIndex
CREATE INDEX "ClientePppoeCuenta_adoptadoPorId_idx" ON "ClientePppoeCuenta"("adoptadoPorId");

-- CreateIndex
CREATE INDEX "ClientePppoeCuenta_empresaId_adoptadoEn_idx" ON "ClientePppoeCuenta"("empresaId", "adoptadoEn");

-- AddForeignKey
ALTER TABLE "ClientePppoeCuenta" ADD CONSTRAINT "ClientePppoeCuenta_adoptadoPorId_fkey" FOREIGN KEY ("adoptadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
