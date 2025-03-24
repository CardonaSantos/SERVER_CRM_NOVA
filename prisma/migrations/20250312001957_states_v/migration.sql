-- DropForeignKey
ALTER TABLE "ClienteInternet" DROP CONSTRAINT "ClienteInternet_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "ClienteInternet" DROP CONSTRAINT "ClienteInternet_servicioId_fkey";

-- AlterTable
ALTER TABLE "ClienteInternet" ALTER COLUMN "contrasenaWifi" DROP NOT NULL,
ALTER COLUMN "servicioId" DROP NOT NULL,
ALTER COLUMN "empresaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "ServicioInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
