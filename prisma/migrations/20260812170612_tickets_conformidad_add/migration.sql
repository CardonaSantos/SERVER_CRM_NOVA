-- CreateEnum
CREATE TYPE "TicketConformidadResultado" AS ENUM ('PENDIENTE', 'CONFORME', 'REQUIERE_RETRABAJO');

-- CreateEnum
CREATE TYPE "TicketConformidadCanal" AS ENUM ('QR', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "TicketFirmaTipo" AS ENUM ('CLIENTE', 'TECNICO');

-- CreateEnum
CREATE TYPE "TicketFirmaOrigen" AS ENUM ('CRM', 'PUBLICO');

-- CreateTable
CREATE TABLE "TicketConformidad" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "tecnicoAsignadoId" INTEGER,
    "creadoPorId" INTEGER,
    "resultado" "TicketConformidadResultado" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "respondidoEn" TIMESTAMP(3),
    "clienteId" INTEGER,

    CONSTRAINT "TicketConformidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketFirma" (
    "id" SERIAL NOT NULL,
    "conformidadId" INTEGER NOT NULL,
    "tipo" "TicketFirmaTipo" NOT NULL,
    "usuarioFirmanteId" INTEGER,
    "nombreFirmante" TEXT NOT NULL,
    "telefonoFirmante" TEXT,
    "origen" "TicketFirmaOrigen" NOT NULL,
    "ipOrigen" TEXT,
    "userAgent" TEXT,
    "firmadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mediaId" INTEGER NOT NULL,

    CONSTRAINT "TicketFirma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketConformidadEnlace" (
    "id" SERIAL NOT NULL,
    "conformidadId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "canal" "TicketConformidadCanal" NOT NULL,
    "telefonoDestino" TEXT,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usadoEn" TIMESTAMP(3),
    "revocadoEn" TIMESTAMP(3),
    "creadoPorId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketConformidadEnlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketConformidad_ticketId_idx" ON "TicketConformidad"("ticketId");

-- CreateIndex
CREATE INDEX "TicketConformidad_clienteId_idx" ON "TicketConformidad"("clienteId");

-- CreateIndex
CREATE INDEX "TicketConformidad_tecnicoAsignadoId_idx" ON "TicketConformidad"("tecnicoAsignadoId");

-- CreateIndex
CREATE INDEX "TicketConformidad_creadoPorId_idx" ON "TicketConformidad"("creadoPorId");

-- CreateIndex
CREATE INDEX "TicketConformidad_resultado_idx" ON "TicketConformidad"("resultado");

-- CreateIndex
CREATE INDEX "TicketConformidad_resultado_creadoEn_idx" ON "TicketConformidad"("resultado", "creadoEn");

-- CreateIndex
CREATE INDEX "TicketConformidad_ticketId_creadoEn_idx" ON "TicketConformidad"("ticketId", "creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "TicketFirma_mediaId_key" ON "TicketFirma"("mediaId");

-- CreateIndex
CREATE INDEX "TicketFirma_conformidadId_idx" ON "TicketFirma"("conformidadId");

-- CreateIndex
CREATE INDEX "TicketFirma_usuarioFirmanteId_idx" ON "TicketFirma"("usuarioFirmanteId");

-- CreateIndex
CREATE INDEX "TicketFirma_tipo_firmadoEn_idx" ON "TicketFirma"("tipo", "firmadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "TicketFirma_conformidadId_tipo_key" ON "TicketFirma"("conformidadId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "TicketConformidadEnlace_tokenHash_key" ON "TicketConformidadEnlace"("tokenHash");

-- CreateIndex
CREATE INDEX "TicketConformidadEnlace_conformidadId_idx" ON "TicketConformidadEnlace"("conformidadId");

-- CreateIndex
CREATE INDEX "TicketConformidadEnlace_creadoPorId_idx" ON "TicketConformidadEnlace"("creadoPorId");

-- CreateIndex
CREATE INDEX "TicketConformidadEnlace_expiraEn_idx" ON "TicketConformidadEnlace"("expiraEn");

-- CreateIndex
CREATE INDEX "TicketConformidadEnlace_conformidadId_creadoEn_idx" ON "TicketConformidadEnlace"("conformidadId", "creadoEn");

-- AddForeignKey
ALTER TABLE "TicketConformidad" ADD CONSTRAINT "TicketConformidad_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketConformidad" ADD CONSTRAINT "TicketConformidad_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketConformidad" ADD CONSTRAINT "TicketConformidad_tecnicoAsignadoId_fkey" FOREIGN KEY ("tecnicoAsignadoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketConformidad" ADD CONSTRAINT "TicketConformidad_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketFirma" ADD CONSTRAINT "TicketFirma_conformidadId_fkey" FOREIGN KEY ("conformidadId") REFERENCES "TicketConformidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketFirma" ADD CONSTRAINT "TicketFirma_usuarioFirmanteId_fkey" FOREIGN KEY ("usuarioFirmanteId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketFirma" ADD CONSTRAINT "TicketFirma_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketConformidadEnlace" ADD CONSTRAINT "TicketConformidadEnlace_conformidadId_fkey" FOREIGN KEY ("conformidadId") REFERENCES "TicketConformidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketConformidadEnlace" ADD CONSTRAINT "TicketConformidadEnlace_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
