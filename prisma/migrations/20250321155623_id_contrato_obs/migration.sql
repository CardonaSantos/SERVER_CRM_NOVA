/*
  Warnings:

  - You are about to drop the column `observacionesn` on the `ContratoFisico` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ContratoFisico" DROP COLUMN "observacionesn",
ADD COLUMN     "observaciones" TEXT;
