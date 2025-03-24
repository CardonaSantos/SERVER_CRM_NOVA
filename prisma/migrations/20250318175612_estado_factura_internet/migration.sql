/*
  Warnings:

  - The `estadoFacturaInternet` column on the `FacturaInternet` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "StateFacturaInternet" AS ENUM ('PENDIENTE', 'PAGADA', 'VENCIDA', 'ANULADA', 'PARCIAL');

-- AlterTable
ALTER TABLE "FacturaInternet" DROP COLUMN "estadoFacturaInternet",
ADD COLUMN     "estadoFacturaInternet" "StateFacturaInternet" NOT NULL DEFAULT 'PENDIENTE';
