-- AlterTable
ALTER TABLE "EtiquetaTicket" ADD COLUMN     "actualizadoEn" TIMESTAMP(3),
ADD COLUMN     "creadoEn" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "TicketEtiqueta" ADD COLUMN     "actualizadoEn" TIMESTAMP(3),
ADD COLUMN     "creadoEn" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
