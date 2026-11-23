-- CreateEnum
CREATE TYPE "PlataformaSesion" AS ENUM ('WEB', 'ANDROID');

-- CreateTable
CREATE TABLE "SesionUsuario" (
    "id" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "plataforma" "PlataformaSesion" NOT NULL DEFAULT 'WEB',
    "instalacionId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaActividadEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraInactividadEn" TIMESTAMP(3) NOT NULL,
    "expiraAbsolutaEn" TIMESTAMP(3) NOT NULL,
    "revocadaEn" TIMESTAMP(3),
    "motivoRevocacion" TEXT,

    CONSTRAINT "SesionUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "sesionId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usadoEn" TIMESTAMP(3),
    "reemplazadoPorId" INTEGER,
    "revocadoEn" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentoAutenticacion" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER,
    "correoHash" TEXT,
    "tipo" TEXT NOT NULL,
    "exitoso" BOOLEAN NOT NULL,
    "motivo" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntentoAutenticacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SesionUsuario_usuarioId_revocadaEn_idx" ON "SesionUsuario"("usuarioId", "revocadaEn");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_sesionId_idx" ON "RefreshToken"("sesionId");

-- CreateIndex
CREATE INDEX "IntentoAutenticacion_usuarioId_creadoEn_idx" ON "IntentoAutenticacion"("usuarioId", "creadoEn");

-- CreateIndex
CREATE INDEX "IntentoAutenticacion_ip_creadoEn_idx" ON "IntentoAutenticacion"("ip", "creadoEn");

-- AddForeignKey
ALTER TABLE "SesionUsuario" ADD CONSTRAINT "SesionUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "SesionUsuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentoAutenticacion" ADD CONSTRAINT "IntentoAutenticacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

