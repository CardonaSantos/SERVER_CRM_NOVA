/*
  Warnings:

  - You are about to drop the column `sucursalId` on the `Usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClienteInternet" ADD COLUMN     "facturacionZonaId" INTEGER;

-- AlterTable
ALTER TABLE "FacturaInternet" ADD COLUMN     "facturacionZonaId" INTEGER;

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "sucursalId";

-- CreateTable
CREATE TABLE "ConfiguracionGlobal" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionGlobal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturacionZona" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "diaGeneracionFactura" INTEGER NOT NULL,
    "diaPago" INTEGER NOT NULL,
    "diaRecordatorio" INTEGER NOT NULL,
    "horaRecordatorio" TEXT NOT NULL,
    "enviarRecordatorio" BOOLEAN NOT NULL DEFAULT true,
    "mediosNotificacion" TEXT NOT NULL,
    "diaCorte" INTEGER,
    "suspenderTrasFacturas" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacturacionZona_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionGlobal_clave_key" ON "ConfiguracionGlobal"("clave");

-- AddForeignKey
ALTER TABLE "ConfiguracionGlobal" ADD CONSTRAINT "ConfiguracionGlobal_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaInternet" ADD CONSTRAINT "FacturaInternet_facturacionZonaId_fkey" FOREIGN KEY ("facturacionZonaId") REFERENCES "FacturacionZona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturacionZona" ADD CONSTRAINT "FacturacionZona_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_facturacionZonaId_fkey" FOREIGN KEY ("facturacionZonaId") REFERENCES "FacturacionZona"("id") ON DELETE SET NULL ON UPDATE CASCADE;
