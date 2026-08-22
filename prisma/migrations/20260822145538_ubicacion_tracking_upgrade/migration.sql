-- CreateEnum
CREATE TYPE "EstadoTrackingTecnico" AS ENUM ('ACTIVA', 'FINALIZADA', 'EXPIRADA');

-- AlterTable
ALTER TABLE "UbicacionTecnico" ADD COLUMN     "capturadoEn" TIMESTAMP(3),
ADD COLUMN     "sesionTrackingId" INTEGER;

-- CreateTable
CREATE TABLE "TecnicoTrackingSesion" (
    "id" SERIAL NOT NULL,
    "tecnicoId" INTEGER NOT NULL,
    "asistenciaId" INTEGER,
    "iniciadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEn" TIMESTAMP(3),
    "ultimoHeartbeatEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoTrackingTecnico" NOT NULL DEFAULT 'ACTIVA',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TecnicoTrackingSesion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TecnicoTrackingSesion_tecnicoId_iniciadoEn_idx" ON "TecnicoTrackingSesion"("tecnicoId", "iniciadoEn");

-- CreateIndex
CREATE INDEX "TecnicoTrackingSesion_tecnicoId_estado_idx" ON "TecnicoTrackingSesion"("tecnicoId", "estado");

-- CreateIndex
CREATE INDEX "TecnicoTrackingSesion_estado_ultimoHeartbeatEn_idx" ON "TecnicoTrackingSesion"("estado", "ultimoHeartbeatEn");

-- CreateIndex
CREATE INDEX "TecnicoTrackingSesion_asistenciaId_iniciadoEn_idx" ON "TecnicoTrackingSesion"("asistenciaId", "iniciadoEn");

-- CreateIndex
CREATE INDEX "Asistencia_fecha_idx" ON "Asistencia"("fecha");

-- CreateIndex
CREATE INDEX "UbicacionTecnico_sesionTrackingId_capturadoEn_idx" ON "UbicacionTecnico"("sesionTrackingId", "capturadoEn");

-- AddForeignKey
ALTER TABLE "TecnicoTrackingSesion" ADD CONSTRAINT "TecnicoTrackingSesion_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TecnicoTrackingSesion" ADD CONSTRAINT "TecnicoTrackingSesion_asistenciaId_fkey" FOREIGN KEY ("asistenciaId") REFERENCES "Asistencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UbicacionTecnico" ADD CONSTRAINT "UbicacionTecnico_sesionTrackingId_fkey" FOREIGN KEY ("sesionTrackingId") REFERENCES "TecnicoTrackingSesion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
