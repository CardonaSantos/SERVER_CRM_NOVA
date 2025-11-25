-- AlterTable
ALTER TABLE "ClienteInternet" ADD COLUMN     "mikrotikRouterId" INTEGER;

-- AlterTable
ALTER TABLE "SeguimientoTicket" ADD COLUMN     "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "SolucionTicket" ADD COLUMN     "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Olt" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "modelo" TEXT,
    "vendor" TEXT,
    "serie" TEXT,
    "mgmtIp" TEXT NOT NULL,
    "mgmtVlan" INTEGER,
    "telnetPort" INTEGER NOT NULL DEFAULT 23,
    "snmpCommunity" TEXT,
    "empresaId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Olt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MikrotikRouter" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "sshPort" INTEGER NOT NULL DEFAULT 22,
    "usuario" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" INTEGER NOT NULL,
    "oltId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MikrotikRouter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Olt_empresaId_nombre_key" ON "Olt"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "MikrotikRouter_empresaId_nombre_key" ON "MikrotikRouter"("empresaId", "nombre");

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_mikrotikRouterId_fkey" FOREIGN KEY ("mikrotikRouterId") REFERENCES "MikrotikRouter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Olt" ADD CONSTRAINT "Olt_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MikrotikRouter" ADD CONSTRAINT "MikrotikRouter_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MikrotikRouter" ADD CONSTRAINT "MikrotikRouter_oltId_fkey" FOREIGN KEY ("oltId") REFERENCES "Olt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
