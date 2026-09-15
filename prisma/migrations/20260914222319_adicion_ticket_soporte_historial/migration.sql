-- CreateEnum
CREATE TYPE "TipoCambioTicket" AS ENUM ('CREADO', 'ACTUALIZADO', 'ESTADO_CAMBIADO', 'PRIORIDAD_CAMBIADA', 'ASIGNACION_CAMBIADA', 'CANCELADO', 'REABIERTO', 'FIJADO', 'DESFIJADO');

-- CreateTable
CREATE TABLE "TicketSoporteHistorial" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "tipo" "TipoCambioTicket" NOT NULL,
    "descripcion" TEXT,
    "usuarioNombre" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketSoporteHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketSoporteHistorial_ticketId_creadoEn_idx" ON "TicketSoporteHistorial"("ticketId", "creadoEn");

-- CreateIndex
CREATE INDEX "TicketSoporteHistorial_usuarioId_creadoEn_idx" ON "TicketSoporteHistorial"("usuarioId", "creadoEn");

-- CreateIndex
CREATE INDEX "TicketSoporteHistorial_tipo_creadoEn_idx" ON "TicketSoporteHistorial"("tipo", "creadoEn");

-- AddForeignKey
ALTER TABLE "TicketSoporteHistorial" ADD CONSTRAINT "TicketSoporteHistorial_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketSoporteHistorial" ADD CONSTRAINT "TicketSoporteHistorial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
