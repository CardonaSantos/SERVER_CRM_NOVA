-- Borrado lógico de rutas de cobro e índice para sumar lo cobrado desde los
-- pagos. Solo agrega: las rutas existentes quedan activas (eliminadoEn NULL).

-- AlterTable
ALTER TABLE "Ruta" ADD COLUMN     "eliminadoEn" TIMESTAMP(3),
ADD COLUMN     "eliminadoPorId" INTEGER;

-- CreateIndex
CREATE INDEX "PagoFacturaInternet_rutaId_idx" ON "PagoFacturaInternet"("rutaId");
