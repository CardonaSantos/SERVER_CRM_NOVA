/*
  Warnings:

  - A unique constraint covering the columns `[empresaId,claveIdempotencia]` on the table `PppoeOperacion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `claveIdempotencia` to the `PppoeOperacion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usuarioPppoeSnapshot` to the `PppoeOperacion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CanalOperacionPppoe" AS ENUM ('SSH', 'ROUTEROS_API', 'MANUAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoPasoPppoe" ADD VALUE 'CONECTAR_ROUTER';
ALTER TYPE "TipoPasoPppoe" ADD VALUE 'BUSCAR_SECRET';
ALTER TYPE "TipoPasoPppoe" ADD VALUE 'CONFIRMAR_SECRET';

-- DropIndex
DROP INDEX "public"."PppoeOperacion_estado_creadoEn_idx";

-- AlterTable
ALTER TABLE "PppoeOperacion" ADD COLUMN     "canal" "CanalOperacionPppoe" NOT NULL DEFAULT 'SSH',
ADD COLUMN     "canceladoEn" TIMESTAMP(3),
ADD COLUMN     "claveIdempotencia" TEXT NOT NULL,
ADD COLUMN     "codigoPerfilSnapshot" TEXT,
ADD COLUMN     "duracionMs" INTEGER,
ADD COLUMN     "numeroIntento" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "perfilHomologacionId" INTEGER,
ADD COLUMN     "reintentoDeId" INTEGER,
ADD COLUMN     "resultado" JSONB,
ADD COLUMN     "routerHostSnapshot" TEXT,
ADD COLUMN     "routerPuertoSnapshot" INTEGER,
ADD COLUMN     "usuarioPppoeSnapshot" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "PppoeOperacion_perfilHomologacionId_idx" ON "PppoeOperacion"("perfilHomologacionId");

-- CreateIndex
CREATE INDEX "PppoeOperacion_reintentoDeId_idx" ON "PppoeOperacion"("reintentoDeId");

-- CreateIndex
CREATE INDEX "PppoeOperacion_tipo_estado_creadoEn_idx" ON "PppoeOperacion"("tipo", "estado", "creadoEn");

-- CreateIndex
CREATE INDEX "PppoeOperacion_canal_creadoEn_idx" ON "PppoeOperacion"("canal", "creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "PppoeOperacion_empresaId_claveIdempotencia_key" ON "PppoeOperacion"("empresaId", "claveIdempotencia");

-- CreateIndex
CREATE INDEX "PppoeOperacionPaso_operacionId_tipo_idx" ON "PppoeOperacionPaso"("operacionId", "tipo");

-- AddForeignKey
ALTER TABLE "PppoeOperacion" ADD CONSTRAINT "PppoeOperacion_perfilHomologacionId_fkey" FOREIGN KEY ("perfilHomologacionId") REFERENCES "PppoePerfilHomologacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeOperacion" ADD CONSTRAINT "PppoeOperacion_reintentoDeId_fkey" FOREIGN KEY ("reintentoDeId") REFERENCES "PppoeOperacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
