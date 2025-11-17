-- CreateEnum
CREATE TYPE "CategoriaNotificacion" AS ENUM ('SISTEMA', 'FACTURACION', 'COBRANZA', 'SOPORTE', 'RUTA_COBRO', 'CLIENTE', 'OTROS');

-- CreateEnum
CREATE TYPE "SeveridadNotificacion" AS ENUM ('INFO', 'EXITO', 'ALERTA', 'ERROR', 'CRITICA');

-- CreateEnum
CREATE TYPE "AudienciaNotificacion" AS ENUM ('USUARIOS', 'ROL', 'EMPRESA', 'GLOBAL');

-- CreateEnum
CREATE TYPE "EstadoCobranzaCliente" AS ENUM ('AL_DIA', 'PAGO_PENDIENTE', 'ATRASADO', 'MOROSO');

-- AlterTable
ALTER TABLE "ClienteInternet" ADD COLUMN     "eliminadoEn" TIMESTAMP(3),
ADD COLUMN     "eliminadoPorId" INTEGER,
ADD COLUMN     "enviarRecordatorio" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "estadoCobranza" "EstadoCobranzaCliente" NOT NULL DEFAULT 'AL_DIA',
ADD COLUMN     "isEliminado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TicketSoporte" ADD COLUMN     "fijado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TicketSoporteTecnico" ADD COLUMN     "esResponsable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resolvioEn" TIMESTAMP(3),
ADD COLUMN     "tiempoTecnicoMinutos" INTEGER;

-- CreateTable
CREATE TABLE "PerfilUsuario" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "avatarUrl" TEXT,
    "portada" TEXT,
    "bio" TEXT,
    "notificarWhatsApp" BOOLEAN NOT NULL DEFAULT true,
    "notificarPush" BOOLEAN NOT NULL DEFAULT true,
    "notificarSonido" BOOLEAN NOT NULL DEFAULT true,
    "telefono" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfilUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketResumen" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "solucionId" INTEGER,
    "resueltoComo" TEXT,
    "notasInternas" TEXT,
    "reabierto" BOOLEAN NOT NULL DEFAULT false,
    "numeroReaperturas" INTEGER NOT NULL DEFAULT 0,
    "intentos" INTEGER NOT NULL DEFAULT 1,
    "tiempoTotalMinutos" INTEGER,
    "tiempoTecnicoMinutos" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketResumen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolucionTicket" (
    "id" SERIAL NOT NULL,
    "solucion" TEXT NOT NULL,
    "descripcion" TEXT,
    "isEliminado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SolucionTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER,
    "titulo" TEXT,
    "mensaje" TEXT NOT NULL,
    "categoria" "CategoriaNotificacion" NOT NULL DEFAULT 'OTROS',
    "subtipo" TEXT,
    "severidad" "SeveridadNotificacion" NOT NULL DEFAULT 'INFO',
    "url" TEXT,
    "referenciaTipo" TEXT,
    "referenciaId" INTEGER,
    "route" TEXT,
    "actionLabel" TEXT,
    "remitenteId" INTEGER,
    "audiencia" "AudienciaNotificacion" NOT NULL DEFAULT 'USUARIOS',
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visibleDesde" TIMESTAMP(3),
    "expiraEn" TIMESTAMP(3),
    "programadaEn" TIMESTAMP(3),

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificacionUsuario" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "notificacionId" INTEGER NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "leidoEn" TIMESTAMP(3),
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "eliminadoEn" TIMESTAMP(3),
    "recibidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fijadoHasta" TIMESTAMP(3),

    CONSTRAINT "NotificacionUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerfilUsuario_usuarioId_key" ON "PerfilUsuario"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketResumen_ticketId_key" ON "TicketResumen"("ticketId");

-- CreateIndex
CREATE INDEX "TicketResumen_solucionId_idx" ON "TicketResumen"("solucionId");

-- CreateIndex
CREATE UNIQUE INDEX "SolucionTicket_solucion_key" ON "SolucionTicket"("solucion");

-- CreateIndex
CREATE INDEX "Notificacion_empresaId_categoria_severidad_fechaCreacion_idx" ON "Notificacion"("empresaId", "categoria", "severidad", "fechaCreacion");

-- CreateIndex
CREATE INDEX "Notificacion_referenciaTipo_referenciaId_idx" ON "Notificacion"("referenciaTipo", "referenciaId");

-- CreateIndex
CREATE INDEX "Notificacion_fechaCreacion_idx" ON "Notificacion"("fechaCreacion");

-- CreateIndex
CREATE INDEX "NotificacionUsuario_usuarioId_eliminado_leido_recibidoEn_idx" ON "NotificacionUsuario"("usuarioId", "eliminado", "leido", "recibidoEn");

-- CreateIndex
CREATE UNIQUE INDEX "NotificacionUsuario_usuarioId_notificacionId_key" ON "NotificacionUsuario"("usuarioId", "notificacionId");

-- AddForeignKey
ALTER TABLE "PerfilUsuario" ADD CONSTRAINT "PerfilUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_eliminadoPorId_fkey" FOREIGN KEY ("eliminadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketResumen" ADD CONSTRAINT "TicketResumen_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketResumen" ADD CONSTRAINT "TicketResumen_solucionId_fkey" FOREIGN KEY ("solucionId") REFERENCES "SolucionTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_remitenteId_fkey" FOREIGN KEY ("remitenteId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionUsuario" ADD CONSTRAINT "NotificacionUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionUsuario" ADD CONSTRAINT "NotificacionUsuario_notificacionId_fkey" FOREIGN KEY ("notificacionId") REFERENCES "Notificacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
