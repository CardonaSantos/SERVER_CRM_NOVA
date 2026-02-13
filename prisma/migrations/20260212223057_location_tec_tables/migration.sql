-- CreateTable
CREATE TABLE "UbicacionTecnico" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "precision" DOUBLE PRECISION,
    "velocidad" DOUBLE PRECISION,
    "bateria" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UbicacionTecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UbicacionActual" (
    "usuarioId" INTEGER NOT NULL,
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "precision" DOUBLE PRECISION,
    "velocidad" DOUBLE PRECISION,
    "bateria" INTEGER,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UbicacionActual_pkey" PRIMARY KEY ("usuarioId")
);

-- CreateIndex
CREATE INDEX "UbicacionTecnico_usuarioId_idx" ON "UbicacionTecnico"("usuarioId");

-- CreateIndex
CREATE INDEX "UbicacionTecnico_creadoEn_idx" ON "UbicacionTecnico"("creadoEn");

-- CreateIndex
CREATE INDEX "UbicacionTecnico_usuarioId_creadoEn_idx" ON "UbicacionTecnico"("usuarioId", "creadoEn");

-- AddForeignKey
ALTER TABLE "UbicacionTecnico" ADD CONSTRAINT "UbicacionTecnico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UbicacionActual" ADD CONSTRAINT "UbicacionActual_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
