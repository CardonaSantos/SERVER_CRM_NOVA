/*
  Warnings:

  - You are about to drop the `ClienteServicioInternet` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[servicioInternetId]` on the table `ClienteInternet` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ClienteServicioInternet" DROP CONSTRAINT "ClienteServicioInternet_clienteInternetId_fkey";

-- DropForeignKey
ALTER TABLE "ClienteServicioInternet" DROP CONSTRAINT "ClienteServicioInternet_servicioInternetId_fkey";

-- AlterTable
ALTER TABLE "ClienteInternet" ADD COLUMN     "servicioInternetId" INTEGER;

-- DropTable
DROP TABLE "ClienteServicioInternet";

-- DropEnum
DROP TYPE "EstadoClienteServicioInternet";

-- CreateIndex
CREATE UNIQUE INDEX "ClienteInternet_servicioInternetId_key" ON "ClienteInternet"("servicioInternetId");

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_servicioInternetId_fkey" FOREIGN KEY ("servicioInternetId") REFERENCES "ServicioInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
