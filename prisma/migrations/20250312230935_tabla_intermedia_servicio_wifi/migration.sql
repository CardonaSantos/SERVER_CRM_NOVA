/*
  Warnings:

  - You are about to drop the column `servicioId` on the `ClienteInternet` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoClienteServicioInternet" AS ENUM ('ACTIVO', 'SUSPENDIDO', 'CANCELADO');

-- DropForeignKey
ALTER TABLE "ClienteInternet" DROP CONSTRAINT "ClienteInternet_servicioId_fkey";

-- AlterTable
ALTER TABLE "ClienteInternet" DROP COLUMN "servicioId";

-- CreateTable
CREATE TABLE "ClienteServicioInternet" (
    "id" SERIAL NOT NULL,
    "clienteInternetId" INTEGER NOT NULL,
    "servicioInternetId" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "estado" "EstadoClienteServicioInternet" NOT NULL DEFAULT 'ACTIVO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteServicioInternet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClienteServicioInternet" ADD CONSTRAINT "ClienteServicioInternet_clienteInternetId_fkey" FOREIGN KEY ("clienteInternetId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteServicioInternet" ADD CONSTRAINT "ClienteServicioInternet_servicioInternetId_fkey" FOREIGN KEY ("servicioInternetId") REFERENCES "ServicioInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
