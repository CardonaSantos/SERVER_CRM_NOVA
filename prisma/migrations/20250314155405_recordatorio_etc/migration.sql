/*
  Warnings:

  - You are about to drop the column `fechaCreacion` on the `TicketSoporte` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TicketSoporte" DROP COLUMN "fechaCreacion",
ADD COLUMN     "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "RecordatorioPago" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "facturaInternetId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fechaEnviado" TIMESTAMP(3) NOT NULL,
    "resultado" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordatorioPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT,
    "telefono" TEXT,
    "fuente" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" INTEGER,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RecordatorioPago" ADD CONSTRAINT "RecordatorioPago_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordatorioPago" ADD CONSTRAINT "RecordatorioPago_facturaInternetId_fkey" FOREIGN KEY ("facturaInternetId") REFERENCES "FacturaInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
