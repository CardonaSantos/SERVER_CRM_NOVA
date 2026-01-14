-- CreateEnum
CREATE TYPE "OrigenCredito" AS ENUM ('TIENDA', 'CAMPO', 'ONLINE', 'REFERIDO', 'USUARIO');

-- CreateEnum
CREATE TYPE "TipoPlantillaLegal" AS ENUM ('CONTRATO', 'PAGARE');

-- CreateEnum
CREATE TYPE "TipoArchivoCliente" AS ENUM ('DPI', 'CASA', 'NEGOCIO', 'RECIBO_LUZ', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoCredito" AS ENUM ('ACTIVO', 'EN_MORA', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoCuota" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "FrecuenciaPago" AS ENUM ('MENSUAL', 'QUINCENAL', 'SEMANAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InteresTipo" AS ENUM ('FIJO', 'VARIABLE');

-- CreateTable
CREATE TABLE "Credito" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "montoCapital" DECIMAL(12,2) NOT NULL,
    "interesPorcentaje" DECIMAL(6,4) NOT NULL,
    "intervaloDias" INTEGER NOT NULL,
    "interesTipo" "InteresTipo" NOT NULL,
    "plazoCuotas" INTEGER NOT NULL,
    "frecuencia" "FrecuenciaPago" NOT NULL,
    "montoTotal" DECIMAL(12,2) NOT NULL,
    "montoCuota" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoCredito" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFinEstimada" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "origenCredito" "OrigenCredito" NOT NULL DEFAULT 'USUARIO',
    "observaciones" TEXT,
    "creadoPorId" INTEGER,

    CONSTRAINT "Credito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuotaCredito" (
    "id" SERIAL NOT NULL,
    "creditoId" INTEGER NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "fechaVenc" TIMESTAMP(3) NOT NULL,
    "montoCapital" DECIMAL(12,2) NOT NULL,
    "montoInteres" DECIMAL(14,4) NOT NULL,
    "montoTotal" DECIMAL(12,2) NOT NULL,
    "montoPagado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estado" "EstadoCuota" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuotaCredito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoCuota" (
    "id" SERIAL NOT NULL,
    "cuotaId" INTEGER NOT NULL,
    "pagoCreditoId" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagoCuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoCredito" (
    "id" SERIAL NOT NULL,
    "creditoId" INTEGER NOT NULL,
    "montoTotal" DECIMAL(12,2) NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "metodoPago" TEXT,
    "referencia" TEXT,
    "observacion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagoCredito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditoEstadoHistorial" (
    "id" SERIAL NOT NULL,
    "creditoId" INTEGER NOT NULL,
    "estado" "EstadoCredito" NOT NULL,
    "motivo" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditoEstadoHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoraCredito" (
    "id" SERIAL NOT NULL,
    "cuotaId" INTEGER NOT NULL,
    "diasMora" INTEGER NOT NULL,
    "interes" DECIMAL(14,4) NOT NULL,
    "calculadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoraCredito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditoContrato" (
    "id" SERIAL NOT NULL,
    "creditoId" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "firmadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditoContrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantillaLegal" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoPlantillaLegal" NOT NULL,
    "nombre" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantillaLegal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoCredito" (
    "id" SERIAL NOT NULL,
    "creditoId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "tipo" "TipoPlantillaLegal" NOT NULL,
    "versionPlantilla" TEXT NOT NULL,
    "contenidoFinal" TEXT NOT NULL,
    "firmadoEn" TIMESTAMP(3),
    "archivoUrl" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoCredito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteExpediente" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "fuenteIngresos" TEXT,
    "tieneDeudas" BOOLEAN,
    "detalleDeudas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteExpediente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteArchivo" (
    "id" SERIAL NOT NULL,
    "expedienteId" INTEGER NOT NULL,
    "tipo" "TipoArchivoCliente" NOT NULL,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteArchivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteReferencia" (
    "id" SERIAL NOT NULL,
    "expedienteId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "relacion" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteReferencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CuotaCredito_creditoId_numeroCuota_key" ON "CuotaCredito"("creditoId", "numeroCuota");

-- CreateIndex
CREATE UNIQUE INDEX "PagoCuota_cuotaId_pagoCreditoId_key" ON "PagoCuota"("cuotaId", "pagoCreditoId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditoContrato_creditoId_key" ON "CreditoContrato"("creditoId");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteExpediente_clienteId_key" ON "ClienteExpediente"("clienteId");

-- AddForeignKey
ALTER TABLE "Credito" ADD CONSTRAINT "Credito_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credito" ADD CONSTRAINT "Credito_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuotaCredito" ADD CONSTRAINT "CuotaCredito_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "Credito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCuota" ADD CONSTRAINT "PagoCuota_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "CuotaCredito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCuota" ADD CONSTRAINT "PagoCuota_pagoCreditoId_fkey" FOREIGN KEY ("pagoCreditoId") REFERENCES "PagoCredito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCredito" ADD CONSTRAINT "PagoCredito_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "Credito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditoEstadoHistorial" ADD CONSTRAINT "CreditoEstadoHistorial_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "Credito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoraCredito" ADD CONSTRAINT "MoraCredito_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "CuotaCredito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditoContrato" ADD CONSTRAINT "CreditoContrato_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "Credito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoCredito" ADD CONSTRAINT "DocumentoCredito_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "Credito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoCredito" ADD CONSTRAINT "DocumentoCredito_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteExpediente" ADD CONSTRAINT "ClienteExpediente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteArchivo" ADD CONSTRAINT "ClienteArchivo_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "ClienteExpediente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteReferencia" ADD CONSTRAINT "ClienteReferencia_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "ClienteExpediente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
