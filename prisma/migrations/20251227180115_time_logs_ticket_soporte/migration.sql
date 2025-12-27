-- CreateTable
CREATE TABLE "TicketTimeLog" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "tecnicoId" INTEGER NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMP(3),
    "duracionMinutos" INTEGER,

    CONSTRAINT "TicketTimeLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TicketTimeLog" ADD CONSTRAINT "TicketTimeLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTimeLog" ADD CONSTRAINT "TicketTimeLog_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
