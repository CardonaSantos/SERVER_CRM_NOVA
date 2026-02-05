-- CreateEnum
CREATE TYPE "EstadoMora" AS ENUM ('PENDIENTE', 'PAGADA');

-- AlterTable
ALTER TABLE "MoraCredito" ADD COLUMN     "estado" "EstadoMora" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "pagadoEn" TIMESTAMP(3),
ADD COLUMN     "pagadoPorId" INTEGER;

-- AddForeignKey
ALTER TABLE "MoraCredito" ADD CONSTRAINT "MoraCredito_pagadoPorId_fkey" FOREIGN KEY ("pagadoPorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
