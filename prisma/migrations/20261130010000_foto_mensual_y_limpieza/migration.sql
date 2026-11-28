-- tareas-programadas #3: foto mensual de la cartera (dashboard) e índice para la
-- limpieza nocturna de intentos de autenticación. Solo agrega.

-- CreateTable
CREATE TABLE "FotoMensualCartera" (
    "id" SERIAL NOT NULL,
    "mes" VARCHAR(7) NOT NULL,
    "tomadaEn" TIMESTAMP(3) NOT NULL,
    "totalClientes" INTEGER NOT NULL,
    "activos" INTEGER NOT NULL,
    "suspendidos" INTEGER NOT NULL,
    "pendientesActivacion" INTEGER NOT NULL,
    "enInstalacion" INTEGER NOT NULL,
    "desinstalados" INTEGER NOT NULL,
    "alDia" INTEGER NOT NULL,
    "pagoPendiente" INTEGER NOT NULL,
    "atrasados" INTEGER NOT NULL,
    "morosos" INTEGER NOT NULL,
    "facturasConDeuda" INTEGER NOT NULL,
    "clientesConDeuda" INTEGER NOT NULL,
    "clientesConDeudaVencida" INTEGER NOT NULL,
    "deuda" DOUBLE PRECISION NOT NULL,
    "deudaVencida" DOUBLE PRECISION NOT NULL,
    "deudaDesinstalados" DOUBLE PRECISION NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FotoMensualCartera_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FotoMensualCartera_mes_key" ON "FotoMensualCartera"("mes");

-- CreateIndex
CREATE INDEX "IntentoAutenticacion_creadoEn_idx" ON "IntentoAutenticacion"("creadoEn");

