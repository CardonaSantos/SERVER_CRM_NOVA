-- CreateTable
CREATE TABLE "ContratoFisico" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER,
    "idContrato" TEXT NOT NULL,
    "fechaFirma" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "archivoContrato" TEXT,
    "observacionesn" TEXT,
    "creadoEn" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContratoFisico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContratoFisico_clienteId_key" ON "ContratoFisico"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "ContratoFisico_idContrato_key" ON "ContratoFisico"("idContrato");

-- AddForeignKey
ALTER TABLE "ContratoFisico" ADD CONSTRAINT "ContratoFisico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
