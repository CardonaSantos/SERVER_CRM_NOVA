-- AlterEnum
ALTER TYPE "EstadoRuta" ADD VALUE 'EN_CURSO';

-- AlterTable
ALTER TABLE "Ruta" ALTER COLUMN "estadoRuta" SET DEFAULT 'ACTIVO';
