-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoCuentaPppoe" ADD VALUE 'PENDIENTE_CREACION';
ALTER TYPE "EstadoCuentaPppoe" ADD VALUE 'EN_SUSPENSION';
ALTER TYPE "EstadoCuentaPppoe" ADD VALUE 'CANCELADA';

-- AlterTable
ALTER TABLE "ClienteInstalacion" ADD COLUMN     "descripcion" TEXT;
