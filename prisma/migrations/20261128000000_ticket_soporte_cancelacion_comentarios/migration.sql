-- AlterTable
ALTER TABLE "EtiquetaTicket" ADD COLUMN     "eliminadoEn" TIMESTAMP(3),
ADD COLUMN     "eliminadoPorId" INTEGER;

-- AlterTable
ALTER TABLE "SeguimientoTicket" ADD COLUMN     "eliminadoEn" TIMESTAMP(3),
ADD COLUMN     "eliminadoPorId" INTEGER;

-- AlterTable
ALTER TABLE "TicketSoporte" ADD COLUMN     "canceladoEn" TIMESTAMP(3),
ADD COLUMN     "canceladoPorId" INTEGER,
ADD COLUMN     "motivoCancelacion" TEXT;

-- CreateTable
CREATE TABLE "SeguimientoTicketMedia" (
    "id" SERIAL NOT NULL,
    "seguimientoId" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeguimientoTicketMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeguimientoTicketMedia_mediaId_key" ON "SeguimientoTicketMedia"("mediaId");

-- CreateIndex
CREATE INDEX "SeguimientoTicketMedia_seguimientoId_idx" ON "SeguimientoTicketMedia"("seguimientoId");

-- CreateIndex
CREATE INDEX "SeguimientoTicket_ticketId_fechaRegistro_idx" ON "SeguimientoTicket"("ticketId", "fechaRegistro");

-- CreateIndex
CREATE INDEX "TicketSoporte_estado_fechaApertura_idx" ON "TicketSoporte"("estado", "fechaApertura");

-- CreateIndex
CREATE INDEX "TicketSoporte_tecnicoId_estado_idx" ON "TicketSoporte"("tecnicoId", "estado");

-- CreateIndex
CREATE INDEX "TicketSoporte_clienteId_idx" ON "TicketSoporte"("clienteId");

-- AddForeignKey
ALTER TABLE "SeguimientoTicketMedia" ADD CONSTRAINT "SeguimientoTicketMedia_seguimientoId_fkey" FOREIGN KEY ("seguimientoId") REFERENCES "SeguimientoTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguimientoTicketMedia" ADD CONSTRAINT "SeguimientoTicketMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

