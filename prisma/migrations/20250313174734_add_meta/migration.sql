-- CreateEnum
CREATE TYPE "EstadoMetaTickets" AS ENUM ('ACTIVO', 'CERRADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "FacturacionZona" ALTER COLUMN "diaRecordatorio" DROP NOT NULL,
ALTER COLUMN "horaRecordatorio" DROP NOT NULL,
ALTER COLUMN "diaSegundoRecordatorio" DROP NOT NULL,
ALTER COLUMN "email" SET DEFAULT false,
ALTER COLUMN "llamada" SET DEFAULT false,
ALTER COLUMN "sms" SET DEFAULT false,
ALTER COLUMN "telegram" SET DEFAULT true,
ALTER COLUMN "whatsapp" SET DEFAULT true;

-- CreateTable
CREATE TABLE "MetaTickets" (
    "id" SERIAL NOT NULL,
    "tituloMetaTicket" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "ticketsMeta" INTEGER NOT NULL,
    "ticketsAvance" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoMetaTickets" NOT NULL DEFAULT 'ACTIVO',
    "usuarioId" INTEGER,
    "cumplida" BOOLEAN NOT NULL DEFAULT false,
    "fechaCompletada" TIMESTAMP(3),

    CONSTRAINT "MetaTickets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MetaTickets" ADD CONSTRAINT "MetaTickets_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
