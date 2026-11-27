-- Borrado lógico de zonas de facturación. Solo agrega columnas opcionales:
-- las zonas existentes quedan activas (eliminadoEn NULL).

-- AlterTable
ALTER TABLE "FacturacionZona" ADD COLUMN     "eliminadoEn" TIMESTAMP(3),
ADD COLUMN     "eliminadoPorId" INTEGER;
