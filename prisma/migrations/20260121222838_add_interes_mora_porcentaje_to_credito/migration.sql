/*
  Warnings:

  - Added the required column `interesMoraPorcentaje` to the `Credito` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Credito" ADD COLUMN     "interesMoraPorcentaje" DECIMAL(6,4) NOT NULL;
