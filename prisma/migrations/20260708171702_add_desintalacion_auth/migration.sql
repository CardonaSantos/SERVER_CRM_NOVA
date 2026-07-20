-- CreateEnum
CREATE TYPE "EstadoAutorizacionDesinstalacion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'ANULADA');

-- CreateTable
CREATE TABLE "ClienteDesinstalacionAutorizacion" (
    "id" SERIAL NOT NULL,
    "desinstalacionId" INTEGER NOT NULL,
    "solicitadoPorId" INTEGER,
    "autorizadoPorId" INTEGER,
    "estado" "EstadoAutorizacionDesinstalacion" NOT NULL DEFAULT 'PENDIENTE',
    "motivoSolicitud" TEXT,
    "comentarioAutorizador" TEXT,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRespuesta" TIMESTAMP(3),

    CONSTRAINT "ClienteDesinstalacionAutorizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClienteDesinstalacionAutorizacion_desinstalacionId_idx" ON "ClienteDesinstalacionAutorizacion"("desinstalacionId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacionAutorizacion_estado_idx" ON "ClienteDesinstalacionAutorizacion"("estado");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacionAutorizacion_autorizadoPorId_idx" ON "ClienteDesinstalacionAutorizacion"("autorizadoPorId");

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacionAutorizacion" ADD CONSTRAINT "ClienteDesinstalacionAutorizacion_desinstalacionId_fkey" FOREIGN KEY ("desinstalacionId") REFERENCES "ClienteDesinstalacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacionAutorizacion" ADD CONSTRAINT "ClienteDesinstalacionAutorizacion_solicitadoPorId_fkey" FOREIGN KEY ("solicitadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacionAutorizacion" ADD CONSTRAINT "ClienteDesinstalacionAutorizacion_autorizadoPorId_fkey" FOREIGN KEY ("autorizadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
