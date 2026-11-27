-- Bitácora de pagos eliminados, ruta de cada pago e id original de las facturas
-- eliminadas. Solo agrega: ningún dato existente se modifica ni se borra.

-- AlterTable
ALTER TABLE "FacturaEliminada" ADD COLUMN     "facturaOriginalId" INTEGER;

-- AlterTable
ALTER TABLE "PagoFacturaInternet" ADD COLUMN     "rutaId" INTEGER;

-- CreateTable
CREATE TABLE "PagoEliminado" (
    "id" SERIAL NOT NULL,
    "pagoId" INTEGER NOT NULL,
    "facturaInternetId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "montoPagado" DOUBLE PRECISION NOT NULL,
    "metodoPago" "MetodoPagoFacturaInternet" NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "pagoCreadoEn" TIMESTAMP(3) NOT NULL,
    "cobradorId" INTEGER,
    "numeroBoleta" TEXT,
    "codigoConfirmacion" TEXT,
    "origen" "OrigenPago" NOT NULL,
    "rutaId" INTEGER,
    "motivo" TEXT NOT NULL,
    "eliminadoPorId" INTEGER NOT NULL,
    "eliminadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoEliminado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PagoEliminado_facturaInternetId_idx" ON "PagoEliminado"("facturaInternetId");

-- CreateIndex
CREATE INDEX "PagoEliminado_clienteId_idx" ON "PagoEliminado"("clienteId");
