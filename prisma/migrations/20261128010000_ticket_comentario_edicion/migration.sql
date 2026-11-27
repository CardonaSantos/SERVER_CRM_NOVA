-- AlterTable
ALTER TABLE "SeguimientoTicket" ADD COLUMN     "editadoEn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SeguimientoTicketMedia" ADD COLUMN     "eliminadoEn" TIMESTAMP(3),
ADD COLUMN     "eliminadoPorId" INTEGER;

