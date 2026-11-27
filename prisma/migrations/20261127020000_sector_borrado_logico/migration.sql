-- Borrado lógico de sectores. Solo agrega columnas opcionales: los sectores
-- existentes quedan vigentes (eliminadoEn NULL).

-- AlterTable
ALTER TABLE "Sector" ADD COLUMN     "eliminadoEn" TIMESTAMP(3),
ADD COLUMN     "eliminadoPorId" INTEGER;
