-- CreateEnum
CREATE TYPE "TipoMedia" AS ENUM ('IMAGEN', 'VIDEO', 'DOCUMENTO', 'AUDIO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoMedia" AS ENUM ('PENDIENTE', 'PROCESANDO', 'LISTO', 'FALLIDO');

-- CreateEnum
CREATE TYPE "ProveedorStorage" AS ENUM ('DO_SPACES', 'AWS_S3', 'GCS', 'AZURE', 'LOCAL');

-- CreateEnum
CREATE TYPE "CategoriaMedia" AS ENUM ('CLIENTE_GENERAL', 'CLIENTE_CONTRATO', 'CLIENTE_INSTALACION', 'SOPORTE_TICKET', 'OTRO');

-- AlterTable
ALTER TABLE "ContratoFisico" ADD COLUMN     "mediaId" INTEGER;

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER,
    "albumId" INTEGER,
    "subidoPorId" INTEGER,
    "categoria" "CategoriaMedia" NOT NULL DEFAULT 'CLIENTE_GENERAL',
    "tipo" "TipoMedia" NOT NULL,
    "estado" "EstadoMedia" NOT NULL DEFAULT 'PENDIENTE',
    "bucket" TEXT,
    "region" TEXT,
    "key" TEXT NOT NULL,
    "cdnUrl" TEXT,
    "mimeType" TEXT,
    "extension" TEXT,
    "tamanioBytes" BIGINT,
    "ancho" INTEGER,
    "alto" INTEGER,
    "duracionSeg" INTEGER,
    "checksumSha256" VARCHAR(64),
    "titulo" TEXT,
    "descripcion" TEXT,
    "etiqueta" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "tomadoEn" TIMESTAMP(3),
    "publico" BOOLEAN NOT NULL DEFAULT false,
    "eliminadoEn" TIMESTAMP(3),
    "metadatos" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumCliente" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "portadaId" INTEGER,
    "esGeneral" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlbumCliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Media_clienteId_albumId_creadoEn_idx" ON "Media"("clienteId", "albumId", "creadoEn" DESC);

-- CreateIndex
CREATE INDEX "Media_empresaId_categoria_tipo_idx" ON "Media"("empresaId", "categoria", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Media_bucket_key_key" ON "Media"("bucket", "key");

-- CreateIndex
CREATE INDEX "AlbumCliente_clienteId_creadoEn_idx" ON "AlbumCliente"("clienteId", "creadoEn" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "AlbumCliente_clienteId_nombre_key" ON "AlbumCliente"("clienteId", "nombre");

-- AddForeignKey
ALTER TABLE "ContratoFisico" ADD CONSTRAINT "ContratoFisico_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "AlbumCliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumCliente" ADD CONSTRAINT "AlbumCliente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumCliente" ADD CONSTRAINT "AlbumCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumCliente" ADD CONSTRAINT "AlbumCliente_portadaId_fkey" FOREIGN KEY ("portadaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
