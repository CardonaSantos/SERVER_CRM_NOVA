-- Registro de ejecuciones de tareas programadas (candado por arriendo).
-- Solo crea tipos, una tabla y sus índices.

-- CreateEnum
CREATE TYPE "EstadoTareaProgramada" AS ENUM ('EJECUTANDO', 'COMPLETADA', 'COMPLETADA_CON_ERRORES', 'FALLIDA');

-- CreateEnum
CREATE TYPE "OrigenTareaProgramada" AS ENUM ('PROGRAMADA', 'MANUAL');

-- CreateTable
CREATE TABLE "TareaProgramadaEjecucion" (
    "id" SERIAL NOT NULL,
    "clave" TEXT NOT NULL,
    "tarea" TEXT NOT NULL,
    "facturacionZonaId" INTEGER,
    "fechaOperativa" DATE NOT NULL,
    "origen" "OrigenTareaProgramada" NOT NULL DEFAULT 'PROGRAMADA',
    "ejecutadaPorId" INTEGER,
    "estado" "EstadoTareaProgramada" NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 1,
    "bloqueadoHasta" TIMESTAMP(3),
    "siguienteIntentoEn" TIMESTAMP(3),
    "iniciadaEn" TIMESTAMP(3) NOT NULL,
    "finalizadaEn" TIMESTAMP(3),
    "procesados" INTEGER NOT NULL DEFAULT 0,
    "errores" INTEGER NOT NULL DEFAULT 0,
    "resumen" JSONB,
    "errorCodigo" TEXT,
    "errorMensaje" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TareaProgramadaEjecucion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TareaProgramadaEjecucion_clave_key" ON "TareaProgramadaEjecucion"("clave");

-- CreateIndex
CREATE INDEX "TareaProgramadaEjecucion_fechaOperativa_tarea_idx" ON "TareaProgramadaEjecucion"("fechaOperativa", "tarea");

-- CreateIndex
CREATE INDEX "TareaProgramadaEjecucion_estado_bloqueadoHasta_idx" ON "TareaProgramadaEjecucion"("estado", "bloqueadoHasta");

