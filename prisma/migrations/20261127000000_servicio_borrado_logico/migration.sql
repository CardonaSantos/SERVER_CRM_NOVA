-- Borrado lógico de planes de internet y servicios adicionales. Solo agrega
-- columnas opcionales: lo existente queda vigente (eliminadoEn NULL).

-- AlterTable
ALTER TABLE "ServicioInternet" ADD COLUMN     "eliminadoEn" TIMESTAMP(3),
ADD COLUMN     "eliminadoPorId" INTEGER;

-- AlterTable
ALTER TABLE "Servicio" ADD COLUMN     "eliminadoEn" TIMESTAMP(3),
ADD COLUMN     "eliminadoPorId" INTEGER;
