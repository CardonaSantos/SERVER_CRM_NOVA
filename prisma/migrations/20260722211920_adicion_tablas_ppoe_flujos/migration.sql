/*
  Warnings:

  - You are about to drop the column `contrasenaWifi` on the `ClienteInstalacion` table. All the data in the column will be lost.
  - You are about to drop the column `esMigrada` on the `ClienteInstalacion` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `ClienteInstalacion` table. All the data in the column will be lost.
  - You are about to drop the column `saldoPendiente` on the `ClienteInstalacion` table. All the data in the column will be lost.
  - You are about to drop the column `ssidRouter` on the `ClienteInstalacion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accesoEquipoId]` on the table `ClienteDesinstalacionEquipo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TecnologiaAccesoInternet" AS ENUM ('FIBRA_GPON', 'INALAMBRICO', 'ETHERNET', 'OTRO');

-- CreateEnum
CREATE TYPE "MetodoAutenticacionInternet" AS ENUM ('PPPOE', 'DHCP', 'IP_ESTATICA', 'NINGUNO');

-- CreateEnum
CREATE TYPE "EstadoAccesoInternet" AS ENUM ('PENDIENTE', 'CONFIGURANDO', 'ACTIVO', 'SUSPENDIDO', 'BAJA');

-- CreateEnum
CREATE TYPE "AccionInstalacionAcceso" AS ENUM ('CREADO', 'MODIFICADO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "RolEquipoAcceso" AS ENUM ('ONU', 'ONT', 'ROUTER', 'REPETIDOR', 'ANTENA_CPE', 'CONVERTIDOR', 'POE', 'SWITCH', 'OTRO');

-- CreateEnum
CREATE TYPE "ModoOperacionEquipo" AS ENUM ('ROUTER', 'BRIDGE', 'ACCESS_POINT', 'REPETIDOR', 'CLIENTE', 'OTRO');

-- CreateEnum
CREATE TYPE "BandaWifi" AS ENUM ('GHZ_2_4', 'GHZ_5', 'DOBLE_BANDA');

-- CreateEnum
CREATE TYPE "EstadoCuentaPppoe" AS ENUM ('PENDIENTE_ACTIVACION', 'EN_INSTALACION', 'EN_ACTIVACION', 'ACTIVA', 'SUSPENDIDA', 'EN_DESINSTALACION', 'ELIMINADA', 'ERROR');

-- CreateEnum
CREATE TYPE "TipoOperacionPppoe" AS ENUM ('CREAR_SECRET', 'ACTIVAR_SECRET', 'SUSPENDER_SERVICIO', 'ELIMINAR_SECRET');

-- CreateEnum
CREATE TYPE "OrigenOperacionPppoe" AS ENUM ('OPERADOR', 'SISTEMA', 'COBRANZA_AUTOMATICA');

-- CreateEnum
CREATE TYPE "EstadoOperacionPppoe" AS ENUM ('PENDIENTE', 'AUTORIZADA', 'EJECUTANDO', 'EXITOSA', 'PARCIAL', 'FALLIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoPasoPppoe" AS ENUM ('AGREGAR_SECRET', 'HABILITAR_SECRET', 'DESHABILITAR_SECRET', 'REMOVER_SESION_ACTIVA', 'ELIMINAR_SECRET');

-- CreateEnum
CREATE TYPE "EstadoPasoPppoe" AS ENUM ('PENDIENTE', 'EJECUTANDO', 'EXITOSO', 'FALLIDO', 'OMITIDO');

-- CreateEnum
CREATE TYPE "AccionAuditoriaPppoe" AS ENUM ('PERFIL_HOMOLOGADO', 'PERFIL_ACTUALIZADO', 'PERFIL_ACTIVADO', 'PERFIL_DESACTIVADO', 'PREALTA_CREADA', 'CONTRASENA_GENERADA', 'CREACION_AUTORIZADA', 'SECRET_CREADO', 'SERVICIO_ACTIVADO', 'SERVICIO_SUSPENDIDO', 'SESION_ACTIVA_REMOVIDA', 'DESINSTALACION_AUTORIZADA', 'SECRET_ELIMINADO', 'REAUTENTICACION_FALLIDA', 'OPERACION_FALLIDA', 'OPERACION_PARCIAL', 'HOJA_VISUALIZADA', 'HOJA_GENERADA');

-- AlterTable
ALTER TABLE "ClienteDesinstalacion" ADD COLUMN     "accesoInternetId" INTEGER;

-- AlterTable
ALTER TABLE "ClienteDesinstalacionEquipo" ADD COLUMN     "accesoEquipoId" INTEGER;

-- AlterTable
ALTER TABLE "ClienteInstalacion" DROP COLUMN "contrasenaWifi",
DROP COLUMN "esMigrada",
DROP COLUMN "metadata",
DROP COLUMN "saldoPendiente",
DROP COLUMN "ssidRouter";

-- CreateTable
CREATE TABLE "ClienteAccesoInternet" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "servicioInternetId" INTEGER,
    "tecnologia" "TecnologiaAccesoInternet" NOT NULL,
    "metodoAutenticacion" "MetodoAutenticacionInternet" NOT NULL,
    "estado" "EstadoAccesoInternet" NOT NULL DEFAULT 'PENDIENTE',
    "activadoEn" TIMESTAMP(3),
    "suspendidoEn" TIMESTAMP(3),
    "dadoDeBajaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteAccesoInternet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteInstalacionAcceso" (
    "id" SERIAL NOT NULL,
    "instalacionId" INTEGER NOT NULL,
    "accesoInternetId" INTEGER NOT NULL,
    "accion" "AccionInstalacionAcceso" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClienteInstalacionAcceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientePppoeCuenta" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "accesoInternetId" INTEGER NOT NULL,
    "perfilHomologacionId" INTEGER NOT NULL,
    "usuario" TEXT NOT NULL,
    "secretoCifrado" TEXT NOT NULL,
    "secretoIv" TEXT NOT NULL,
    "secretoAuthTag" TEXT NOT NULL,
    "versionClave" INTEGER NOT NULL DEFAULT 1,
    "estado" "EstadoCuentaPppoe" NOT NULL DEFAULT 'PENDIENTE_ACTIVACION',
    "generadoPorId" INTEGER,
    "generadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "secretCreadoEn" TIMESTAMP(3),
    "activadoEn" TIMESTAMP(3),
    "suspendidoEn" TIMESTAMP(3),
    "eliminadoEn" TIMESTAMP(3),
    "ultimaSincronizacionEn" TIMESTAMP(3),
    "ultimoError" TEXT,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientePppoeCuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PppoeOperacion" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "cuentaPppoeId" INTEGER NOT NULL,
    "mikrotikRouterId" INTEGER NOT NULL,
    "instalacionId" INTEGER,
    "desinstalacionId" INTEGER,
    "tipo" "TipoOperacionPppoe" NOT NULL,
    "origen" "OrigenOperacionPppoe" NOT NULL,
    "estado" "EstadoOperacionPppoe" NOT NULL DEFAULT 'PENDIENTE',
    "iniciadoPorId" INTEGER,
    "reautenticadoPorId" INTEGER,
    "requiereReautenticacion" BOOLEAN NOT NULL DEFAULT false,
    "reautenticacionExitosa" BOOLEAN,
    "reautenticadoEn" TIMESTAMP(3),
    "motivo" TEXT,
    "errorCodigo" TEXT,
    "errorMensaje" TEXT,
    "iniciadoEn" TIMESTAMP(3),
    "finalizadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PppoeOperacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PppoeAuditoria" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER,
    "accesoInternetId" INTEGER,
    "cuentaPppoeId" INTEGER,
    "perfilHomologacionId" INTEGER,
    "instalacionId" INTEGER,
    "desinstalacionId" INTEGER,
    "operacionId" INTEGER,
    "operadorId" INTEGER,
    "origen" "OrigenOperacionPppoe" NOT NULL,
    "accion" "AccionAuditoriaPppoe" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estadoCuentaAnterior" "EstadoCuentaPppoe",
    "estadoCuentaNuevo" "EstadoCuentaPppoe",
    "usuarioPppoeSnapshot" TEXT,
    "perfilCodigoSnapshot" TEXT,
    "operadorNombreSnapshot" TEXT,
    "datos" JSONB,
    "ipOrigen" TEXT,
    "userAgent" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PppoeAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PppoeOperacionPaso" (
    "id" SERIAL NOT NULL,
    "operacionId" INTEGER NOT NULL,
    "tipo" "TipoPasoPppoe" NOT NULL,
    "orden" INTEGER NOT NULL,
    "estado" "EstadoPasoPppoe" NOT NULL DEFAULT 'PENDIENTE',
    "comandoSanitizado" TEXT,
    "respuestaSanitizada" TEXT,
    "errorCodigo" TEXT,
    "errorMensaje" TEXT,
    "iniciadoEn" TIMESTAMP(3),
    "finalizadoEn" TIMESTAMP(3),
    "duracionMs" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PppoeOperacionPaso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteAccesoEquipo" (
    "id" SERIAL NOT NULL,
    "accesoInternetId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "serialProductoId" INTEGER,
    "instalacionAsignacionId" INTEGER,
    "instalacionRetiroId" INTEGER,
    "modoOperacion" "ModoOperacionEquipo",
    "rol" "RolEquipoAcceso" NOT NULL,
    "ipGestion" TEXT,
    "asignadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiradoEn" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteAccesoEquipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PppoePerfilHomologacion" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "mikrotikRouterId" INTEGER NOT NULL,
    "servicioInternetId" INTEGER NOT NULL,
    "codigoPerfil" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoPorId" INTEGER,
    "actualizadoPorId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PppoePerfilHomologacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteAccesoConfiguracionTecnica" (
    "id" SERIAL NOT NULL,
    "accesoInternetId" INTEGER NOT NULL,
    "instalacionId" INTEGER,
    "potenciaOpticaRxDbm" DECIMAL(6,2),
    "senalInalambricaDbm" DECIMAL(6,2),
    "ssid" TEXT,
    "contrasenaWifiProtegida" TEXT,
    "bandaWifi" "BandaWifi",
    "canal" INTEGER,
    "anchoCanalMhz" INTEGER,
    "ipv4" TEXT,
    "ipv6" TEXT,
    "gateway" TEXT,
    "dnsPrimario" TEXT,
    "dnsSecundario" TEXT,
    "observaciones" TEXT,
    "configuradoPorId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteAccesoConfiguracionTecnica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClienteAccesoInternet_empresaId_clienteId_idx" ON "ClienteAccesoInternet"("empresaId", "clienteId");

-- CreateIndex
CREATE INDEX "ClienteAccesoInternet_empresaId_estado_idx" ON "ClienteAccesoInternet"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "ClienteAccesoInternet_servicioInternetId_idx" ON "ClienteAccesoInternet"("servicioInternetId");

-- CreateIndex
CREATE INDEX "ClienteInstalacionAcceso_accesoInternetId_idx" ON "ClienteInstalacionAcceso"("accesoInternetId");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteInstalacionAcceso_instalacionId_accesoInternetId_key" ON "ClienteInstalacionAcceso"("instalacionId", "accesoInternetId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientePppoeCuenta_accesoInternetId_key" ON "ClientePppoeCuenta"("accesoInternetId");

-- CreateIndex
CREATE INDEX "ClientePppoeCuenta_empresaId_estado_idx" ON "ClientePppoeCuenta"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "ClientePppoeCuenta_perfilHomologacionId_idx" ON "ClientePppoeCuenta"("perfilHomologacionId");

-- CreateIndex
CREATE INDEX "ClientePppoeCuenta_generadoPorId_idx" ON "ClientePppoeCuenta"("generadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientePppoeCuenta_empresaId_usuario_key" ON "ClientePppoeCuenta"("empresaId", "usuario");

-- CreateIndex
CREATE INDEX "PppoeOperacion_empresaId_creadoEn_idx" ON "PppoeOperacion"("empresaId", "creadoEn");

-- CreateIndex
CREATE INDEX "PppoeOperacion_cuentaPppoeId_creadoEn_idx" ON "PppoeOperacion"("cuentaPppoeId", "creadoEn");

-- CreateIndex
CREATE INDEX "PppoeOperacion_mikrotikRouterId_creadoEn_idx" ON "PppoeOperacion"("mikrotikRouterId", "creadoEn");

-- CreateIndex
CREATE INDEX "PppoeOperacion_instalacionId_idx" ON "PppoeOperacion"("instalacionId");

-- CreateIndex
CREATE INDEX "PppoeOperacion_desinstalacionId_idx" ON "PppoeOperacion"("desinstalacionId");

-- CreateIndex
CREATE INDEX "PppoeOperacion_estado_creadoEn_idx" ON "PppoeOperacion"("estado", "creadoEn");

-- CreateIndex
CREATE INDEX "PppoeOperacion_iniciadoPorId_idx" ON "PppoeOperacion"("iniciadoPorId");

-- CreateIndex
CREATE INDEX "PppoeOperacion_reautenticadoPorId_idx" ON "PppoeOperacion"("reautenticadoPorId");

-- CreateIndex
CREATE INDEX "PppoeAuditoria_empresaId_creadoEn_idx" ON "PppoeAuditoria"("empresaId", "creadoEn");

-- CreateIndex
CREATE INDEX "PppoeAuditoria_clienteId_creadoEn_idx" ON "PppoeAuditoria"("clienteId", "creadoEn");

-- CreateIndex
CREATE INDEX "PppoeAuditoria_accesoInternetId_creadoEn_idx" ON "PppoeAuditoria"("accesoInternetId", "creadoEn");

-- CreateIndex
CREATE INDEX "PppoeAuditoria_cuentaPppoeId_creadoEn_idx" ON "PppoeAuditoria"("cuentaPppoeId", "creadoEn");

-- CreateIndex
CREATE INDEX "PppoeAuditoria_perfilHomologacionId_creadoEn_idx" ON "PppoeAuditoria"("perfilHomologacionId", "creadoEn");

-- CreateIndex
CREATE INDEX "PppoeAuditoria_instalacionId_creadoEn_idx" ON "PppoeAuditoria"("instalacionId", "creadoEn");

-- CreateIndex
CREATE INDEX "PppoeAuditoria_desinstalacionId_creadoEn_idx" ON "PppoeAuditoria"("desinstalacionId", "creadoEn");

-- CreateIndex
CREATE INDEX "PppoeAuditoria_operacionId_idx" ON "PppoeAuditoria"("operacionId");

-- CreateIndex
CREATE INDEX "PppoeAuditoria_operadorId_creadoEn_idx" ON "PppoeAuditoria"("operadorId", "creadoEn");

-- CreateIndex
CREATE INDEX "PppoeAuditoria_accion_creadoEn_idx" ON "PppoeAuditoria"("accion", "creadoEn");

-- CreateIndex
CREATE INDEX "PppoeOperacionPaso_operacionId_estado_idx" ON "PppoeOperacionPaso"("operacionId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "PppoeOperacionPaso_operacionId_orden_key" ON "PppoeOperacionPaso"("operacionId", "orden");

-- CreateIndex
CREATE INDEX "ClienteAccesoEquipo_accesoInternetId_activo_idx" ON "ClienteAccesoEquipo"("accesoInternetId", "activo");

-- CreateIndex
CREATE INDEX "ClienteAccesoEquipo_productoId_idx" ON "ClienteAccesoEquipo"("productoId");

-- CreateIndex
CREATE INDEX "ClienteAccesoEquipo_serialProductoId_idx" ON "ClienteAccesoEquipo"("serialProductoId");

-- CreateIndex
CREATE INDEX "ClienteAccesoEquipo_instalacionAsignacionId_idx" ON "ClienteAccesoEquipo"("instalacionAsignacionId");

-- CreateIndex
CREATE INDEX "ClienteAccesoEquipo_instalacionRetiroId_idx" ON "ClienteAccesoEquipo"("instalacionRetiroId");

-- CreateIndex
CREATE INDEX "PppoePerfilHomologacion_empresaId_activo_idx" ON "PppoePerfilHomologacion"("empresaId", "activo");

-- CreateIndex
CREATE INDEX "PppoePerfilHomologacion_servicioInternetId_idx" ON "PppoePerfilHomologacion"("servicioInternetId");

-- CreateIndex
CREATE INDEX "PppoePerfilHomologacion_creadoPorId_idx" ON "PppoePerfilHomologacion"("creadoPorId");

-- CreateIndex
CREATE INDEX "PppoePerfilHomologacion_actualizadoPorId_idx" ON "PppoePerfilHomologacion"("actualizadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "PppoePerfilHomologacion_mikrotikRouterId_servicioInternetId_key" ON "PppoePerfilHomologacion"("mikrotikRouterId", "servicioInternetId");

-- CreateIndex
CREATE UNIQUE INDEX "PppoePerfilHomologacion_mikrotikRouterId_codigoPerfil_key" ON "PppoePerfilHomologacion"("mikrotikRouterId", "codigoPerfil");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteAccesoConfiguracionTecnica_accesoInternetId_key" ON "ClienteAccesoConfiguracionTecnica"("accesoInternetId");

-- CreateIndex
CREATE INDEX "ClienteAccesoConfiguracionTecnica_instalacionId_idx" ON "ClienteAccesoConfiguracionTecnica"("instalacionId");

-- CreateIndex
CREATE INDEX "ClienteAccesoConfiguracionTecnica_configuradoPorId_idx" ON "ClienteAccesoConfiguracionTecnica"("configuradoPorId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacion_accesoInternetId_idx" ON "ClienteDesinstalacion"("accesoInternetId");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteDesinstalacionEquipo_accesoEquipoId_key" ON "ClienteDesinstalacionEquipo"("accesoEquipoId");

-- AddForeignKey
ALTER TABLE "ClienteAccesoInternet" ADD CONSTRAINT "ClienteAccesoInternet_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteAccesoInternet" ADD CONSTRAINT "ClienteAccesoInternet_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteAccesoInternet" ADD CONSTRAINT "ClienteAccesoInternet_servicioInternetId_fkey" FOREIGN KEY ("servicioInternetId") REFERENCES "ServicioInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacionAcceso" ADD CONSTRAINT "ClienteInstalacionAcceso_instalacionId_fkey" FOREIGN KEY ("instalacionId") REFERENCES "ClienteInstalacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacionAcceso" ADD CONSTRAINT "ClienteInstalacionAcceso_accesoInternetId_fkey" FOREIGN KEY ("accesoInternetId") REFERENCES "ClienteAccesoInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientePppoeCuenta" ADD CONSTRAINT "ClientePppoeCuenta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientePppoeCuenta" ADD CONSTRAINT "ClientePppoeCuenta_accesoInternetId_fkey" FOREIGN KEY ("accesoInternetId") REFERENCES "ClienteAccesoInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientePppoeCuenta" ADD CONSTRAINT "ClientePppoeCuenta_perfilHomologacionId_fkey" FOREIGN KEY ("perfilHomologacionId") REFERENCES "PppoePerfilHomologacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientePppoeCuenta" ADD CONSTRAINT "ClientePppoeCuenta_generadoPorId_fkey" FOREIGN KEY ("generadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeOperacion" ADD CONSTRAINT "PppoeOperacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeOperacion" ADD CONSTRAINT "PppoeOperacion_cuentaPppoeId_fkey" FOREIGN KEY ("cuentaPppoeId") REFERENCES "ClientePppoeCuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeOperacion" ADD CONSTRAINT "PppoeOperacion_mikrotikRouterId_fkey" FOREIGN KEY ("mikrotikRouterId") REFERENCES "MikrotikRouter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeOperacion" ADD CONSTRAINT "PppoeOperacion_instalacionId_fkey" FOREIGN KEY ("instalacionId") REFERENCES "ClienteInstalacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeOperacion" ADD CONSTRAINT "PppoeOperacion_desinstalacionId_fkey" FOREIGN KEY ("desinstalacionId") REFERENCES "ClienteDesinstalacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeOperacion" ADD CONSTRAINT "PppoeOperacion_iniciadoPorId_fkey" FOREIGN KEY ("iniciadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeOperacion" ADD CONSTRAINT "PppoeOperacion_reautenticadoPorId_fkey" FOREIGN KEY ("reautenticadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeAuditoria" ADD CONSTRAINT "PppoeAuditoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeAuditoria" ADD CONSTRAINT "PppoeAuditoria_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeAuditoria" ADD CONSTRAINT "PppoeAuditoria_accesoInternetId_fkey" FOREIGN KEY ("accesoInternetId") REFERENCES "ClienteAccesoInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeAuditoria" ADD CONSTRAINT "PppoeAuditoria_cuentaPppoeId_fkey" FOREIGN KEY ("cuentaPppoeId") REFERENCES "ClientePppoeCuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeAuditoria" ADD CONSTRAINT "PppoeAuditoria_perfilHomologacionId_fkey" FOREIGN KEY ("perfilHomologacionId") REFERENCES "PppoePerfilHomologacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeAuditoria" ADD CONSTRAINT "PppoeAuditoria_instalacionId_fkey" FOREIGN KEY ("instalacionId") REFERENCES "ClienteInstalacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeAuditoria" ADD CONSTRAINT "PppoeAuditoria_desinstalacionId_fkey" FOREIGN KEY ("desinstalacionId") REFERENCES "ClienteDesinstalacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeAuditoria" ADD CONSTRAINT "PppoeAuditoria_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES "PppoeOperacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeAuditoria" ADD CONSTRAINT "PppoeAuditoria_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoeOperacionPaso" ADD CONSTRAINT "PppoeOperacionPaso_operacionId_fkey" FOREIGN KEY ("operacionId") REFERENCES "PppoeOperacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteAccesoEquipo" ADD CONSTRAINT "ClienteAccesoEquipo_accesoInternetId_fkey" FOREIGN KEY ("accesoInternetId") REFERENCES "ClienteAccesoInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteAccesoEquipo" ADD CONSTRAINT "ClienteAccesoEquipo_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteAccesoEquipo" ADD CONSTRAINT "ClienteAccesoEquipo_serialProductoId_fkey" FOREIGN KEY ("serialProductoId") REFERENCES "SerialProducto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteAccesoEquipo" ADD CONSTRAINT "ClienteAccesoEquipo_instalacionAsignacionId_fkey" FOREIGN KEY ("instalacionAsignacionId") REFERENCES "ClienteInstalacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteAccesoEquipo" ADD CONSTRAINT "ClienteAccesoEquipo_instalacionRetiroId_fkey" FOREIGN KEY ("instalacionRetiroId") REFERENCES "ClienteInstalacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoePerfilHomologacion" ADD CONSTRAINT "PppoePerfilHomologacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoePerfilHomologacion" ADD CONSTRAINT "PppoePerfilHomologacion_mikrotikRouterId_fkey" FOREIGN KEY ("mikrotikRouterId") REFERENCES "MikrotikRouter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoePerfilHomologacion" ADD CONSTRAINT "PppoePerfilHomologacion_servicioInternetId_fkey" FOREIGN KEY ("servicioInternetId") REFERENCES "ServicioInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoePerfilHomologacion" ADD CONSTRAINT "PppoePerfilHomologacion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppoePerfilHomologacion" ADD CONSTRAINT "PppoePerfilHomologacion_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteAccesoConfiguracionTecnica" ADD CONSTRAINT "ClienteAccesoConfiguracionTecnica_accesoInternetId_fkey" FOREIGN KEY ("accesoInternetId") REFERENCES "ClienteAccesoInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteAccesoConfiguracionTecnica" ADD CONSTRAINT "ClienteAccesoConfiguracionTecnica_instalacionId_fkey" FOREIGN KEY ("instalacionId") REFERENCES "ClienteInstalacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteAccesoConfiguracionTecnica" ADD CONSTRAINT "ClienteAccesoConfiguracionTecnica_configuradoPorId_fkey" FOREIGN KEY ("configuradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacion" ADD CONSTRAINT "ClienteDesinstalacion_accesoInternetId_fkey" FOREIGN KEY ("accesoInternetId") REFERENCES "ClienteAccesoInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacionEquipo" ADD CONSTRAINT "ClienteDesinstalacionEquipo_accesoEquipoId_fkey" FOREIGN KEY ("accesoEquipoId") REFERENCES "ClienteAccesoEquipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
