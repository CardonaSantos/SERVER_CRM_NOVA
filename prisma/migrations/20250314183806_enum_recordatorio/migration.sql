/*
  Warnings:

  - Changed the type of `resultado` on the `RecordatorioPago` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ResultadoRecordatorioPago" AS ENUM ('PENDIENTE', 'PAGADO', 'OTRO');

-- AlterTable
ALTER TABLE "RecordatorioPago" DROP COLUMN "resultado",
ADD COLUMN     "resultado" "ResultadoRecordatorioPago" NOT NULL;
