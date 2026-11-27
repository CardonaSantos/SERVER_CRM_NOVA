-- Campañas de WhatsApp con su resultado por destinatario. Solo agrega.

-- CreateEnum
CREATE TYPE "EstadoCampaniaMensaje" AS ENUM ('EN_CURSO', 'COMPLETADA', 'INTERRUMPIDA');

-- CreateEnum
CREATE TYPE "EstadoEnvioMensaje" AS ENUM ('PENDIENTE', 'ENVIANDO', 'ENVIADO', 'FALLIDO', 'OMITIDO', 'SIN_CONFIRMAR');

-- CreateTable
CREATE TABLE "CampaniaMensaje" (
    "id" SERIAL NOT NULL,
    "plantilla" TEXT NOT NULL,
    "idioma" TEXT NOT NULL,
    "imagenUrl" TEXT,
    "estado" "EstadoCampaniaMensaje" NOT NULL DEFAULT 'EN_CURSO',
    "creadoPorId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actividadEn" TIMESTAMP(3) NOT NULL,
    "finalizadaEn" TIMESTAMP(3),

    CONSTRAINT "CampaniaMensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvioCampaniaMensaje" (
    "id" SERIAL NOT NULL,
    "campaniaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "telefono" TEXT,
    "estado" "EstadoEnvioMensaje" NOT NULL DEFAULT 'PENDIENTE',
    "motivo" TEXT,
    "detalle" TEXT,
    "mensajeProveedorId" TEXT,
    "intentadoEn" TIMESTAMP(3),

    CONSTRAINT "EnvioCampaniaMensaje_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaniaMensaje_estado_idx" ON "CampaniaMensaje"("estado");

-- CreateIndex
CREATE INDEX "EnvioCampaniaMensaje_campaniaId_estado_idx" ON "EnvioCampaniaMensaje"("campaniaId", "estado");

-- CreateIndex
CREATE INDEX "EnvioCampaniaMensaje_clienteId_idx" ON "EnvioCampaniaMensaje"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "EnvioCampaniaMensaje_campaniaId_clienteId_telefono_key" ON "EnvioCampaniaMensaje"("campaniaId", "clienteId", "telefono");

-- AddForeignKey
ALTER TABLE "CampaniaMensaje" ADD CONSTRAINT "CampaniaMensaje_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvioCampaniaMensaje" ADD CONSTRAINT "EnvioCampaniaMensaje_campaniaId_fkey" FOREIGN KEY ("campaniaId") REFERENCES "CampaniaMensaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvioCampaniaMensaje" ADD CONSTRAINT "EnvioCampaniaMensaje_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
