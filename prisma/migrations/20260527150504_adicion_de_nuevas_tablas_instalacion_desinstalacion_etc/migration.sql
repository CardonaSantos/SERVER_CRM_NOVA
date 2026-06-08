-- CreateEnum
CREATE TYPE "EstadoPrestamoHerramienta" AS ENUM ('PRESTADO', 'DEVUELTO', 'DEVUELTO_DANADO', 'PERDIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoInstalacionCliente" AS ENUM ('PROGRAMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA', 'FALLIDA', 'REPROGRAMADA');

-- CreateEnum
CREATE TYPE "TipoInstalacionCliente" AS ENUM ('NUEVA', 'REINSTALACION', 'TRASLADO', 'CAMBIO_EQUIPO', 'MIGRACION_PLAN', 'MIGRACION_TECNOLOGIA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoDesinstalacionCliente" AS ENUM ('PROGRAMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA', 'FALLIDA');

-- CreateEnum
CREATE TYPE "TipoDesinstalacionCliente" AS ENUM ('COMPLETA', 'PARCIAL', 'RETIRO_EQUIPO', 'CAMBIO_DOMICILIO', 'CANCELACION_SERVICIO', 'OTRO');

-- CreateEnum
CREATE TYPE "MotivoDesinstalacionCliente" AS ENUM ('VOLUNTARIA', 'MORA', 'CAMBIO_DOMICILIO', 'MAL_SERVICIO', 'FRAUDE', 'FALLA_TECNICA', 'CAMBIO_PROVEEDOR', 'CLIENTE_NO_LOCALIZADO', 'OTRO');

-- CreateEnum
CREATE TYPE "RolTecnicoOperacionCliente" AS ENUM ('RESPONSABLE', 'APOYO', 'SUPERVISOR', 'COBRADOR', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoEvidenciaClienteOperacion" AS ENUM ('ANTES', 'DESPUES', 'EQUIPO', 'ROUTER', 'ONU', 'ANTENA', 'CABLEADO', 'UBICACION', 'FIRMA', 'BOLETA', 'RECIBO', 'DOCUMENTO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoEquipoRetirado" AS ENUM ('RECUPERADO_BUENO', 'RECUPERADO_DANADO', 'NO_RECUPERADO', 'PERDIDO', 'CLIENTE_LO_CONSERVA', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoCambioEstadoCliente" AS ENUM ('CAMBIO_ESTADO', 'SOFT_DELETE', 'RESTAURACION', 'DESINSTALACION', 'REINSTALACION', 'WHATSAPP_ACTIVADO', 'WHATSAPP_DESACTIVADO', 'OTRO');

-- CreateEnum
CREATE TYPE "CanalOrigen" AS ENUM ('ADMIN', 'PORTAL', 'WHATSAPP', 'BOT', 'LLAMADA', 'APP', 'OTRO');

-- CreateEnum
CREATE TYPE "NivelComplejidad" AS ENUM ('BASICO', 'INTERMEDIO', 'AVANZADO', 'CRITICO');

-- CreateEnum
CREATE TYPE "TipoGasto" AS ENUM ('COMBUSTIBLE', 'HERRAMIENTA', 'MATERIAL', 'VIATICO', 'TRANSPORTE', 'SERVICIO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoGasto" AS ENUM ('BORRADOR', 'CONFIRMADO', 'APROBADO', 'RECHAZADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "SlaBucket" AS ENUM ('MENOR_24H', 'H_24_48', 'H_48_72', 'H_72_96', 'MAYOR_96H');

-- CreateEnum
CREATE TYPE "TipoBodega" AS ENUM ('ALMACEN', 'VEHICULO', 'OFICINA', 'EXTERNO');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "EstadoSerial" AS ENUM ('EN_STOCK', 'PRESTADO', 'INSTALADO', 'DEFECTUOSO', 'EN_REPARACION', 'EXTRAVIADO', 'DADO_DE_BAJA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CategoriaMedia" ADD VALUE 'CLIENTE_DESINSTALACION';
ALTER TYPE "CategoriaMedia" ADD VALUE 'CLIENTE_ELIMINACION';

-- DropForeignKey
ALTER TABLE "public"."TicketTimeLog" DROP CONSTRAINT "TicketTimeLog_ticketId_fkey";

-- AlterTable
ALTER TABLE "ClienteInternet" ADD COLUMN     "comentarioEliminacion" TEXT,
ADD COLUMN     "motivoEliminacion" TEXT,
ADD COLUMN     "motivoWhatsappDesactivado" TEXT,
ADD COLUMN     "restauradoEn" TIMESTAMP(3),
ADD COLUMN     "restauradoPorId" INTEGER,
ADD COLUMN     "whatsappActivo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "whatsappDesactivadoEn" TIMESTAMP(3),
ADD COLUMN     "whatsappDesactivadoPorId" INTEGER;

-- CreateTable
CREATE TABLE "PrestamoHerramienta" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "serialProductoId" INTEGER NOT NULL,
    "bodegaOrigenId" INTEGER,
    "bodegaRetornoId" INTEGER,
    "tecnicoId" INTEGER NOT NULL,
    "entregadoPorId" INTEGER,
    "recibidoPorId" INTEGER,
    "estado" "EstadoPrestamoHerramienta" NOT NULL DEFAULT 'PRESTADO',
    "fechaPrestamo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEsperadaDevolucion" TIMESTAMP(3),
    "fechaDevolucion" TIMESTAMP(3),
    "observacionEntrega" TEXT,
    "observacionDevolucion" TEXT,
    "motivoNoDevuelto" TEXT,
    "evidenciaEntregaMediaId" INTEGER,
    "evidenciaDevolucionMediaId" INTEGER,
    "movimientoSalidaId" INTEGER,
    "movimientoRetornoId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrestamoHerramienta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketHerramientaUso" (
    "id" SERIAL NOT NULL,
    "prestamoHerramientaId" INTEGER NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "tecnicoId" INTEGER,
    "usadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "devueltoEnTicket" BOOLEAN NOT NULL DEFAULT false,
    "nota" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketHerramientaUso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketReasignacion" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "tecnicoAnteriorId" INTEGER,
    "tecnicoNuevoId" INTEGER NOT NULL,
    "reasignadoPorId" INTEGER,
    "motivo" TEXT,
    "reasignadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketReasignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GastoOperativo" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "registradoPorId" INTEGER,
    "tipoGasto" "TipoGasto" NOT NULL,
    "subtipo" TEXT,
    "descripcion" TEXT,
    "montoTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "esRecuperable" BOOLEAN NOT NULL DEFAULT false,
    "evidenciaMediaId" INTEGER,
    "productoId" INTEGER,
    "movimientoInventarioId" INTEGER,
    "estado" "EstadoGasto" NOT NULL DEFAULT 'BORRADOR',
    "aprobadoPorId" INTEGER,
    "aprobadoEn" TIMESTAMP(3),
    "fechaGasto" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "clienteInstalacionId" INTEGER,
    "clienteDesinstalacionId" INTEGER,

    CONSTRAINT "GastoOperativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketGasto" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "gastoId" INTEGER NOT NULL,
    "montoAsignado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "porcentajeAsignado" DECIMAL(6,2),
    "tecnicoId" INTEGER,
    "asignadoPorId" INTEGER,
    "nota" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketGasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bodega" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoBodega" NOT NULL DEFAULT 'ALMACEN',
    "descripcion" TEXT,
    "responsableId" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bodega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaProducto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoriaProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "categoriaId" INTEGER,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "sku" TEXT,
    "unidadMedida" TEXT DEFAULT 'unidad',
    "costoPromedio" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costoUltimo" DECIMAL(12,2),
    "stockTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "esSeriable" BOOLEAN NOT NULL DEFAULT false,
    "esActivo" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "isEliminado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockProducto" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cantidadReservada" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerialProducto" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "serial" TEXT NOT NULL,
    "estado" "EstadoSerial" NOT NULL DEFAULT 'EN_STOCK',
    "bodegaId" INTEGER,
    "clienteId" INTEGER,
    "ticketInstalacionId" INTEGER,
    "instaladoEn" TIMESTAMP(3),
    "motivoBaja" TEXT,
    "fechaBaja" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SerialProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "tipoMovimiento" "TipoMovimiento" NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "costoUnitario" DECIMAL(12,2) NOT NULL,
    "costoTotal" DECIMAL(14,2) NOT NULL,
    "bodegaOrigenId" INTEGER,
    "bodegaDestinoId" INTEGER,
    "ticketId" INTEGER,
    "proveedorId" INTEGER,
    "referencia" TEXT,
    "notas" TEXT,
    "realizadoPorId" INTEGER,
    "stockResultante" DECIMAL(10,2),
    "serialId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteInstalacionMedia" (
    "id" SERIAL NOT NULL,
    "instalacionId" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,
    "tipo" "TipoEvidenciaClienteOperacion" NOT NULL DEFAULT 'OTRO',
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClienteInstalacionMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteInstalacionTecnico" (
    "id" SERIAL NOT NULL,
    "instalacionId" INTEGER NOT NULL,
    "tecnicoId" INTEGER,
    "rol" "RolTecnicoOperacionCliente" NOT NULL DEFAULT 'APOYO',
    "esResponsable" BOOLEAN NOT NULL DEFAULT false,
    "tiempoMinutos" INTEGER,
    "observaciones" TEXT,
    "tecnicoNombreSnapshot" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteInstalacionTecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteInstalacionEquipo" (
    "id" SERIAL NOT NULL,
    "instalacionId" INTEGER NOT NULL,
    "productoId" INTEGER,
    "serialProductoId" INTEGER,
    "movimientoInventarioId" INTEGER,
    "descripcion" TEXT,
    "cantidad" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "costoUnitario" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costoTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "serialSnapshot" TEXT,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteInstalacionEquipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteInstalacion" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "servicioInternetId" INTEGER,
    "ticketId" INTEGER,
    "asesorId" INTEGER,
    "creadoPorId" INTEGER,
    "completadoPorId" INTEGER,
    "tipo" "TipoInstalacionCliente" NOT NULL DEFAULT 'NUEVA',
    "estado" "EstadoInstalacionCliente" NOT NULL DEFAULT 'PROGRAMADA',
    "fechaProgramada" TIMESTAMP(3),
    "fechaInicio" TIMESTAMP(3),
    "fechaFinalizacion" TIMESTAMP(3),
    "fechaCancelacion" TIMESTAMP(3),
    "fechaActivacionServicio" TIMESTAMP(3),
    "motivo" TEXT,
    "observaciones" TEXT,
    "resultado" TEXT,
    "direccionInstalacion" TEXT,
    "referenciaUbicacion" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "ssidRouter" TEXT,
    "contrasenaWifi" TEXT,
    "costoInstalacion" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costoMateriales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costoManoObra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costoOtros" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "montoCobradoCliente" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldoPendiente" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notasCostos" TEXT,
    "esMigrada" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteInstalacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteDesinstalacion" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "servicioInternetId" INTEGER,
    "ticketId" INTEGER,
    "solicitadoPorId" INTEGER,
    "ejecutadoPorId" INTEGER,
    "creadoPorId" INTEGER,
    "tipo" "TipoDesinstalacionCliente" NOT NULL DEFAULT 'COMPLETA',
    "motivo" "MotivoDesinstalacionCliente",
    "estado" "EstadoDesinstalacionCliente" NOT NULL DEFAULT 'PROGRAMADA',
    "fechaSolicitud" TIMESTAMP(3),
    "fechaProgramada" TIMESTAMP(3),
    "fechaInicio" TIMESTAMP(3),
    "fechaFinalizacion" TIMESTAMP(3),
    "fechaCancelacion" TIMESTAMP(3),
    "requiereRetiroEquipo" BOOLEAN NOT NULL DEFAULT true,
    "equipoRecuperado" BOOLEAN NOT NULL DEFAULT false,
    "saldoClienteAlMomento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costoDesinstalacion" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costoTransporte" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costoManoObra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costoOtros" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "direccionServicio" TEXT,
    "referenciaUbicacion" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "firmadoPor" TEXT,
    "dpiFirmante" TEXT,
    "conforme" BOOLEAN,
    "observaciones" TEXT,
    "resultado" TEXT,
    "metadata" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteDesinstalacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteDesinstalacionTecnico" (
    "id" SERIAL NOT NULL,
    "desinstalacionId" INTEGER NOT NULL,
    "tecnicoId" INTEGER,
    "rol" "RolTecnicoOperacionCliente" NOT NULL DEFAULT 'APOYO',
    "esResponsable" BOOLEAN NOT NULL DEFAULT false,
    "tiempoMinutos" INTEGER,
    "observaciones" TEXT,
    "tecnicoNombreSnapshot" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteDesinstalacionTecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteDesinstalacionMedia" (
    "id" SERIAL NOT NULL,
    "desinstalacionId" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,
    "tipo" "TipoEvidenciaClienteOperacion" NOT NULL DEFAULT 'OTRO',
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClienteDesinstalacionMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteDesinstalacionEquipo" (
    "id" SERIAL NOT NULL,
    "desinstalacionId" INTEGER NOT NULL,
    "productoId" INTEGER,
    "serialProductoId" INTEGER,
    "movimientoInventarioId" INTEGER,
    "bodegaDestinoId" INTEGER,
    "descripcion" TEXT,
    "cantidad" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "estadoRetiro" "EstadoEquipoRetirado" NOT NULL DEFAULT 'RECUPERADO_BUENO',
    "costoRecuperacion" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "serialSnapshot" TEXT,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteDesinstalacionEquipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteEstadoHistorial" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "tipoCambio" "TipoCambioEstadoCliente" NOT NULL,
    "estadoAnterior" "EstadoCliente",
    "estadoNuevo" "EstadoCliente",
    "isEliminadoAnterior" BOOLEAN,
    "isEliminadoNuevo" BOOLEAN,
    "whatsappActivoAnterior" BOOLEAN,
    "whatsappActivoNuevo" BOOLEAN,
    "motivo" TEXT,
    "descripcion" TEXT,
    "cambiadoPorId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClienteEstadoHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrestamoHerramienta_movimientoSalidaId_key" ON "PrestamoHerramienta"("movimientoSalidaId");

-- CreateIndex
CREATE UNIQUE INDEX "PrestamoHerramienta_movimientoRetornoId_key" ON "PrestamoHerramienta"("movimientoRetornoId");

-- CreateIndex
CREATE INDEX "PrestamoHerramienta_empresaId_estado_idx" ON "PrestamoHerramienta"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "PrestamoHerramienta_serialProductoId_idx" ON "PrestamoHerramienta"("serialProductoId");

-- CreateIndex
CREATE INDEX "PrestamoHerramienta_tecnicoId_idx" ON "PrestamoHerramienta"("tecnicoId");

-- CreateIndex
CREATE INDEX "PrestamoHerramienta_fechaPrestamo_idx" ON "PrestamoHerramienta"("fechaPrestamo");

-- CreateIndex
CREATE INDEX "TicketHerramientaUso_ticketId_idx" ON "TicketHerramientaUso"("ticketId");

-- CreateIndex
CREATE INDEX "TicketHerramientaUso_prestamoHerramientaId_idx" ON "TicketHerramientaUso"("prestamoHerramientaId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketHerramientaUso_prestamoHerramientaId_ticketId_key" ON "TicketHerramientaUso"("prestamoHerramientaId", "ticketId");

-- CreateIndex
CREATE INDEX "TicketReasignacion_ticketId_idx" ON "TicketReasignacion"("ticketId");

-- CreateIndex
CREATE INDEX "TicketReasignacion_tecnicoNuevoId_idx" ON "TicketReasignacion"("tecnicoNuevoId");

-- CreateIndex
CREATE UNIQUE INDEX "GastoOperativo_movimientoInventarioId_key" ON "GastoOperativo"("movimientoInventarioId");

-- CreateIndex
CREATE INDEX "GastoOperativo_clienteInstalacionId_idx" ON "GastoOperativo"("clienteInstalacionId");

-- CreateIndex
CREATE INDEX "GastoOperativo_clienteDesinstalacionId_idx" ON "GastoOperativo"("clienteDesinstalacionId");

-- CreateIndex
CREATE INDEX "GastoOperativo_empresaId_tipoGasto_fechaGasto_idx" ON "GastoOperativo"("empresaId", "tipoGasto", "fechaGasto");

-- CreateIndex
CREATE INDEX "GastoOperativo_registradoPorId_idx" ON "GastoOperativo"("registradoPorId");

-- CreateIndex
CREATE INDEX "GastoOperativo_productoId_idx" ON "GastoOperativo"("productoId");

-- CreateIndex
CREATE INDEX "TicketGasto_ticketId_idx" ON "TicketGasto"("ticketId");

-- CreateIndex
CREATE INDEX "TicketGasto_gastoId_idx" ON "TicketGasto"("gastoId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketGasto_ticketId_gastoId_key" ON "TicketGasto"("ticketId", "gastoId");

-- CreateIndex
CREATE INDEX "Bodega_empresaId_idx" ON "Bodega"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Bodega_empresaId_nombre_key" ON "Bodega"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaProducto_empresaId_nombre_key" ON "CategoriaProducto"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "Producto_empresaId_categoriaId_idx" ON "Producto"("empresaId", "categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_empresaId_sku_key" ON "Producto"("empresaId", "sku");

-- CreateIndex
CREATE INDEX "StockProducto_bodegaId_idx" ON "StockProducto"("bodegaId");

-- CreateIndex
CREATE INDEX "StockProducto_productoId_idx" ON "StockProducto"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "StockProducto_productoId_bodegaId_key" ON "StockProducto"("productoId", "bodegaId");

-- CreateIndex
CREATE INDEX "SerialProducto_productoId_estado_idx" ON "SerialProducto"("productoId", "estado");

-- CreateIndex
CREATE INDEX "SerialProducto_clienteId_idx" ON "SerialProducto"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "SerialProducto_serial_key" ON "SerialProducto"("serial");

-- CreateIndex
CREATE INDEX "MovimientoInventario_serialId_idx" ON "MovimientoInventario"("serialId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_productoId_tipoMovimiento_creadoEn_idx" ON "MovimientoInventario"("productoId", "tipoMovimiento", "creadoEn");

-- CreateIndex
CREATE INDEX "MovimientoInventario_empresaId_creadoEn_idx" ON "MovimientoInventario"("empresaId", "creadoEn");

-- CreateIndex
CREATE INDEX "MovimientoInventario_ticketId_idx" ON "MovimientoInventario"("ticketId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_bodegaOrigenId_idx" ON "MovimientoInventario"("bodegaOrigenId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_bodegaDestinoId_idx" ON "MovimientoInventario"("bodegaDestinoId");

-- CreateIndex
CREATE INDEX "ClienteInstalacionMedia_mediaId_idx" ON "ClienteInstalacionMedia"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteInstalacionMedia_instalacionId_mediaId_key" ON "ClienteInstalacionMedia"("instalacionId", "mediaId");

-- CreateIndex
CREATE INDEX "ClienteInstalacionTecnico_instalacionId_idx" ON "ClienteInstalacionTecnico"("instalacionId");

-- CreateIndex
CREATE INDEX "ClienteInstalacionTecnico_tecnicoId_idx" ON "ClienteInstalacionTecnico"("tecnicoId");

-- CreateIndex
CREATE INDEX "ClienteInstalacionEquipo_instalacionId_idx" ON "ClienteInstalacionEquipo"("instalacionId");

-- CreateIndex
CREATE INDEX "ClienteInstalacionEquipo_productoId_idx" ON "ClienteInstalacionEquipo"("productoId");

-- CreateIndex
CREATE INDEX "ClienteInstalacionEquipo_serialProductoId_idx" ON "ClienteInstalacionEquipo"("serialProductoId");

-- CreateIndex
CREATE INDEX "ClienteInstalacionEquipo_movimientoInventarioId_idx" ON "ClienteInstalacionEquipo"("movimientoInventarioId");

-- CreateIndex
CREATE INDEX "ClienteInstalacion_empresaId_estado_idx" ON "ClienteInstalacion"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "ClienteInstalacion_empresaId_clienteId_idx" ON "ClienteInstalacion"("empresaId", "clienteId");

-- CreateIndex
CREATE INDEX "ClienteInstalacion_clienteId_fechaFinalizacion_idx" ON "ClienteInstalacion"("clienteId", "fechaFinalizacion");

-- CreateIndex
CREATE INDEX "ClienteInstalacion_servicioInternetId_idx" ON "ClienteInstalacion"("servicioInternetId");

-- CreateIndex
CREATE INDEX "ClienteInstalacion_ticketId_idx" ON "ClienteInstalacion"("ticketId");

-- CreateIndex
CREATE INDEX "ClienteInstalacion_asesorId_idx" ON "ClienteInstalacion"("asesorId");

-- CreateIndex
CREATE INDEX "ClienteInstalacion_creadoPorId_idx" ON "ClienteInstalacion"("creadoPorId");

-- CreateIndex
CREATE INDEX "ClienteInstalacion_completadoPorId_idx" ON "ClienteInstalacion"("completadoPorId");

-- CreateIndex
CREATE INDEX "ClienteInstalacion_estado_fechaProgramada_idx" ON "ClienteInstalacion"("estado", "fechaProgramada");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacion_empresaId_estado_idx" ON "ClienteDesinstalacion"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacion_empresaId_clienteId_idx" ON "ClienteDesinstalacion"("empresaId", "clienteId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacion_clienteId_fechaFinalizacion_idx" ON "ClienteDesinstalacion"("clienteId", "fechaFinalizacion");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacion_servicioInternetId_idx" ON "ClienteDesinstalacion"("servicioInternetId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacion_ticketId_idx" ON "ClienteDesinstalacion"("ticketId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacion_solicitadoPorId_idx" ON "ClienteDesinstalacion"("solicitadoPorId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacion_ejecutadoPorId_idx" ON "ClienteDesinstalacion"("ejecutadoPorId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacion_creadoPorId_idx" ON "ClienteDesinstalacion"("creadoPorId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacion_estado_fechaProgramada_idx" ON "ClienteDesinstalacion"("estado", "fechaProgramada");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacionTecnico_desinstalacionId_idx" ON "ClienteDesinstalacionTecnico"("desinstalacionId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacionTecnico_tecnicoId_idx" ON "ClienteDesinstalacionTecnico"("tecnicoId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacionMedia_mediaId_idx" ON "ClienteDesinstalacionMedia"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteDesinstalacionMedia_desinstalacionId_mediaId_key" ON "ClienteDesinstalacionMedia"("desinstalacionId", "mediaId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacionEquipo_desinstalacionId_idx" ON "ClienteDesinstalacionEquipo"("desinstalacionId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacionEquipo_productoId_idx" ON "ClienteDesinstalacionEquipo"("productoId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacionEquipo_serialProductoId_idx" ON "ClienteDesinstalacionEquipo"("serialProductoId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacionEquipo_movimientoInventarioId_idx" ON "ClienteDesinstalacionEquipo"("movimientoInventarioId");

-- CreateIndex
CREATE INDEX "ClienteDesinstalacionEquipo_bodegaDestinoId_idx" ON "ClienteDesinstalacionEquipo"("bodegaDestinoId");

-- CreateIndex
CREATE INDEX "ClienteEstadoHistorial_clienteId_creadoEn_idx" ON "ClienteEstadoHistorial"("clienteId", "creadoEn");

-- CreateIndex
CREATE INDEX "ClienteEstadoHistorial_empresaId_tipoCambio_idx" ON "ClienteEstadoHistorial"("empresaId", "tipoCambio");

-- CreateIndex
CREATE INDEX "ClienteEstadoHistorial_cambiadoPorId_idx" ON "ClienteEstadoHistorial"("cambiadoPorId");

-- CreateIndex
CREATE INDEX "ClienteInternet_empresaId_isEliminado_idx" ON "ClienteInternet"("empresaId", "isEliminado");

-- CreateIndex
CREATE INDEX "ClienteInternet_empresaId_estadoCliente_idx" ON "ClienteInternet"("empresaId", "estadoCliente");

-- CreateIndex
CREATE INDEX "ClienteInternet_restauradoPorId_idx" ON "ClienteInternet"("restauradoPorId");

-- CreateIndex
CREATE INDEX "ClienteInternet_whatsappDesactivadoPorId_idx" ON "ClienteInternet"("whatsappDesactivadoPorId");

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_restauradoPorId_fkey" FOREIGN KEY ("restauradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_whatsappDesactivadoPorId_fkey" FOREIGN KEY ("whatsappDesactivadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTimeLog" ADD CONSTRAINT "TicketTimeLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestamoHerramienta" ADD CONSTRAINT "PrestamoHerramienta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestamoHerramienta" ADD CONSTRAINT "PrestamoHerramienta_serialProductoId_fkey" FOREIGN KEY ("serialProductoId") REFERENCES "SerialProducto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestamoHerramienta" ADD CONSTRAINT "PrestamoHerramienta_bodegaOrigenId_fkey" FOREIGN KEY ("bodegaOrigenId") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestamoHerramienta" ADD CONSTRAINT "PrestamoHerramienta_bodegaRetornoId_fkey" FOREIGN KEY ("bodegaRetornoId") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestamoHerramienta" ADD CONSTRAINT "PrestamoHerramienta_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestamoHerramienta" ADD CONSTRAINT "PrestamoHerramienta_entregadoPorId_fkey" FOREIGN KEY ("entregadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestamoHerramienta" ADD CONSTRAINT "PrestamoHerramienta_recibidoPorId_fkey" FOREIGN KEY ("recibidoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestamoHerramienta" ADD CONSTRAINT "PrestamoHerramienta_evidenciaEntregaMediaId_fkey" FOREIGN KEY ("evidenciaEntregaMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestamoHerramienta" ADD CONSTRAINT "PrestamoHerramienta_evidenciaDevolucionMediaId_fkey" FOREIGN KEY ("evidenciaDevolucionMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestamoHerramienta" ADD CONSTRAINT "PrestamoHerramienta_movimientoSalidaId_fkey" FOREIGN KEY ("movimientoSalidaId") REFERENCES "MovimientoInventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestamoHerramienta" ADD CONSTRAINT "PrestamoHerramienta_movimientoRetornoId_fkey" FOREIGN KEY ("movimientoRetornoId") REFERENCES "MovimientoInventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketHerramientaUso" ADD CONSTRAINT "TicketHerramientaUso_prestamoHerramientaId_fkey" FOREIGN KEY ("prestamoHerramientaId") REFERENCES "PrestamoHerramienta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketHerramientaUso" ADD CONSTRAINT "TicketHerramientaUso_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketHerramientaUso" ADD CONSTRAINT "TicketHerramientaUso_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReasignacion" ADD CONSTRAINT "TicketReasignacion_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReasignacion" ADD CONSTRAINT "TicketReasignacion_tecnicoAnteriorId_fkey" FOREIGN KEY ("tecnicoAnteriorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReasignacion" ADD CONSTRAINT "TicketReasignacion_tecnicoNuevoId_fkey" FOREIGN KEY ("tecnicoNuevoId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReasignacion" ADD CONSTRAINT "TicketReasignacion_reasignadoPorId_fkey" FOREIGN KEY ("reasignadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoOperativo" ADD CONSTRAINT "GastoOperativo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoOperativo" ADD CONSTRAINT "GastoOperativo_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoOperativo" ADD CONSTRAINT "GastoOperativo_evidenciaMediaId_fkey" FOREIGN KEY ("evidenciaMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoOperativo" ADD CONSTRAINT "GastoOperativo_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoOperativo" ADD CONSTRAINT "GastoOperativo_movimientoInventarioId_fkey" FOREIGN KEY ("movimientoInventarioId") REFERENCES "MovimientoInventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoOperativo" ADD CONSTRAINT "GastoOperativo_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoOperativo" ADD CONSTRAINT "GastoOperativo_clienteInstalacionId_fkey" FOREIGN KEY ("clienteInstalacionId") REFERENCES "ClienteInstalacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoOperativo" ADD CONSTRAINT "GastoOperativo_clienteDesinstalacionId_fkey" FOREIGN KEY ("clienteDesinstalacionId") REFERENCES "ClienteDesinstalacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketGasto" ADD CONSTRAINT "TicketGasto_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketGasto" ADD CONSTRAINT "TicketGasto_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "GastoOperativo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketGasto" ADD CONSTRAINT "TicketGasto_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketGasto" ADD CONSTRAINT "TicketGasto_asignadoPorId_fkey" FOREIGN KEY ("asignadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bodega" ADD CONSTRAINT "Bodega_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bodega" ADD CONSTRAINT "Bodega_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaProducto" ADD CONSTRAINT "CategoriaProducto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockProducto" ADD CONSTRAINT "StockProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockProducto" ADD CONSTRAINT "StockProducto_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialProducto" ADD CONSTRAINT "SerialProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialProducto" ADD CONSTRAINT "SerialProducto_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialProducto" ADD CONSTRAINT "SerialProducto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialProducto" ADD CONSTRAINT "SerialProducto_ticketInstalacionId_fkey" FOREIGN KEY ("ticketInstalacionId") REFERENCES "TicketSoporte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_bodegaOrigenId_fkey" FOREIGN KEY ("bodegaOrigenId") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_bodegaDestinoId_fkey" FOREIGN KEY ("bodegaDestinoId") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_serialId_fkey" FOREIGN KEY ("serialId") REFERENCES "SerialProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacionMedia" ADD CONSTRAINT "ClienteInstalacionMedia_instalacionId_fkey" FOREIGN KEY ("instalacionId") REFERENCES "ClienteInstalacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacionMedia" ADD CONSTRAINT "ClienteInstalacionMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacionTecnico" ADD CONSTRAINT "ClienteInstalacionTecnico_instalacionId_fkey" FOREIGN KEY ("instalacionId") REFERENCES "ClienteInstalacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacionTecnico" ADD CONSTRAINT "ClienteInstalacionTecnico_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacionEquipo" ADD CONSTRAINT "ClienteInstalacionEquipo_instalacionId_fkey" FOREIGN KEY ("instalacionId") REFERENCES "ClienteInstalacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacionEquipo" ADD CONSTRAINT "ClienteInstalacionEquipo_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacionEquipo" ADD CONSTRAINT "ClienteInstalacionEquipo_serialProductoId_fkey" FOREIGN KEY ("serialProductoId") REFERENCES "SerialProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacionEquipo" ADD CONSTRAINT "ClienteInstalacionEquipo_movimientoInventarioId_fkey" FOREIGN KEY ("movimientoInventarioId") REFERENCES "MovimientoInventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacion" ADD CONSTRAINT "ClienteInstalacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacion" ADD CONSTRAINT "ClienteInstalacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacion" ADD CONSTRAINT "ClienteInstalacion_servicioInternetId_fkey" FOREIGN KEY ("servicioInternetId") REFERENCES "ServicioInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacion" ADD CONSTRAINT "ClienteInstalacion_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacion" ADD CONSTRAINT "ClienteInstalacion_asesorId_fkey" FOREIGN KEY ("asesorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacion" ADD CONSTRAINT "ClienteInstalacion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInstalacion" ADD CONSTRAINT "ClienteInstalacion_completadoPorId_fkey" FOREIGN KEY ("completadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacion" ADD CONSTRAINT "ClienteDesinstalacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacion" ADD CONSTRAINT "ClienteDesinstalacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacion" ADD CONSTRAINT "ClienteDesinstalacion_servicioInternetId_fkey" FOREIGN KEY ("servicioInternetId") REFERENCES "ServicioInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacion" ADD CONSTRAINT "ClienteDesinstalacion_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacion" ADD CONSTRAINT "ClienteDesinstalacion_solicitadoPorId_fkey" FOREIGN KEY ("solicitadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacion" ADD CONSTRAINT "ClienteDesinstalacion_ejecutadoPorId_fkey" FOREIGN KEY ("ejecutadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacion" ADD CONSTRAINT "ClienteDesinstalacion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacionTecnico" ADD CONSTRAINT "ClienteDesinstalacionTecnico_desinstalacionId_fkey" FOREIGN KEY ("desinstalacionId") REFERENCES "ClienteDesinstalacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacionTecnico" ADD CONSTRAINT "ClienteDesinstalacionTecnico_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacionMedia" ADD CONSTRAINT "ClienteDesinstalacionMedia_desinstalacionId_fkey" FOREIGN KEY ("desinstalacionId") REFERENCES "ClienteDesinstalacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacionMedia" ADD CONSTRAINT "ClienteDesinstalacionMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacionEquipo" ADD CONSTRAINT "ClienteDesinstalacionEquipo_desinstalacionId_fkey" FOREIGN KEY ("desinstalacionId") REFERENCES "ClienteDesinstalacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacionEquipo" ADD CONSTRAINT "ClienteDesinstalacionEquipo_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacionEquipo" ADD CONSTRAINT "ClienteDesinstalacionEquipo_serialProductoId_fkey" FOREIGN KEY ("serialProductoId") REFERENCES "SerialProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacionEquipo" ADD CONSTRAINT "ClienteDesinstalacionEquipo_movimientoInventarioId_fkey" FOREIGN KEY ("movimientoInventarioId") REFERENCES "MovimientoInventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteDesinstalacionEquipo" ADD CONSTRAINT "ClienteDesinstalacionEquipo_bodegaDestinoId_fkey" FOREIGN KEY ("bodegaDestinoId") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteEstadoHistorial" ADD CONSTRAINT "ClienteEstadoHistorial_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteEstadoHistorial" ADD CONSTRAINT "ClienteEstadoHistorial_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteEstadoHistorial" ADD CONSTRAINT "ClienteEstadoHistorial_cambiadoPorId_fkey" FOREIGN KEY ("cambiadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
