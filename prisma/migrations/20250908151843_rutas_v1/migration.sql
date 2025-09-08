-- CreateEnum
CREATE TYPE "OrigenPago" AS ENUM ('RUTA', 'OFICINA', 'TRANSFERENCIA', 'EN_LINEA');

-- CreateEnum
CREATE TYPE "EstadoAsignacionRuta" AS ENUM ('ASIGNADA', 'EN_PROCESO', 'COBRADA', 'CANCELADA', 'REASIGNADA');

-- CreateEnum
CREATE TYPE "EstadoRutaTurno" AS ENUM ('ABIERTA', 'EN_CURSO', 'CERRADA', 'ANULADA');

-- AlterEnum
ALTER TYPE "EstadoRuta" ADD VALUE 'ASIGNADA';

-- AlterTable
ALTER TABLE "ClienteInternet" ADD COLUMN     "nota" TEXT;

-- AlterTable
ALTER TABLE "PagoFacturaInternet" ADD COLUMN     "facturaRutaId" INTEGER,
ADD COLUMN     "origen" "OrigenPago" NOT NULL DEFAULT 'RUTA';

-- CreateTable
CREATE TABLE "RutaTurno" (
    "id" SERIAL NOT NULL,
    "rutaId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "cobradorId" INTEGER,
    "estado" "EstadoRutaTurno" NOT NULL DEFAULT 'ABIERTA',
    "aperturaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cierreEn" TIMESTAMP(3),
    "notas" TEXT,
    "totalAsignadas" INTEGER NOT NULL DEFAULT 0,
    "totalCobradas" INTEGER NOT NULL DEFAULT 0,
    "sumaCobros" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "RutaTurno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaRuta" (
    "id" SERIAL NOT NULL,
    "rutaId" INTEGER NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "asignadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asignadaPorId" INTEGER,
    "estado" "EstadoAsignacionRuta" NOT NULL DEFAULT 'ASIGNADA',
    "motivo" TEXT,
    "cobradaEn" TIMESTAMP(3),
    "cobradaPorId" INTEGER,
    "observaciones" TEXT,

    CONSTRAINT "FacturaRuta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RutaTurno_estado_idx" ON "RutaTurno"("estado");

-- CreateIndex
CREATE INDEX "RutaTurno_cobradorId_idx" ON "RutaTurno"("cobradorId");

-- CreateIndex
CREATE UNIQUE INDEX "RutaTurno_rutaId_fecha_key" ON "RutaTurno"("rutaId", "fecha");

-- CreateIndex
CREATE INDEX "FacturaRuta_facturaId_estado_idx" ON "FacturaRuta"("facturaId", "estado");

-- CreateIndex
CREATE INDEX "FacturaRuta_rutaId_estado_idx" ON "FacturaRuta"("rutaId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "FacturaRuta_rutaId_facturaId_key" ON "FacturaRuta"("rutaId", "facturaId");

-- CreateIndex
CREATE INDEX "PagoFacturaInternet_facturaRutaId_idx" ON "PagoFacturaInternet"("facturaRutaId");

-- CreateIndex
CREATE INDEX "PagoFacturaInternet_facturaInternetId_fechaPago_idx" ON "PagoFacturaInternet"("facturaInternetId", "fechaPago");

-- AddForeignKey
ALTER TABLE "PagoFacturaInternet" ADD CONSTRAINT "PagoFacturaInternet_facturaRutaId_fkey" FOREIGN KEY ("facturaRutaId") REFERENCES "FacturaRuta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RutaTurno" ADD CONSTRAINT "RutaTurno_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RutaTurno" ADD CONSTRAINT "RutaTurno_cobradorId_fkey" FOREIGN KEY ("cobradorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaRuta" ADD CONSTRAINT "FacturaRuta_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaRuta" ADD CONSTRAINT "FacturaRuta_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "FacturaInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaRuta" ADD CONSTRAINT "FacturaRuta_asignadaPorId_fkey" FOREIGN KEY ("asignadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaRuta" ADD CONSTRAINT "FacturaRuta_cobradaPorId_fkey" FOREIGN KEY ("cobradaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
