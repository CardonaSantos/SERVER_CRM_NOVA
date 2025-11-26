-- CreateEnum
CREATE TYPE "EstadoServicioMikrotik" AS ENUM ('SIN_MIKROTIK', 'ACTIVO', 'SUSPENDIDO', 'PENDIENTE_APLICAR', 'ERROR');

-- AlterTable
ALTER TABLE "ClienteInternet" ADD COLUMN     "estadoServicioMikrotik" "EstadoServicioMikrotik" NOT NULL DEFAULT 'SIN_MIKROTIK';
