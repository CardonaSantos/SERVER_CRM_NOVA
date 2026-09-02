-- CreateTable
CREATE TABLE "UsuarioPushDispositivo" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "instalacionId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL DEFAULT 'FCM',
    "plataforma" TEXT NOT NULL DEFAULT 'ANDROID',
    "nombreDispositivo" TEXT,
    "modeloDispositivo" TEXT,
    "versionApp" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoRegistroEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsuarioPushDispositivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioPushDispositivo_instalacionId_key" ON "UsuarioPushDispositivo"("instalacionId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioPushDispositivo_token_key" ON "UsuarioPushDispositivo"("token");

-- CreateIndex
CREATE INDEX "UsuarioPushDispositivo_usuarioId_activo_idx" ON "UsuarioPushDispositivo"("usuarioId", "activo");

-- CreateIndex
CREATE INDEX "UsuarioPushDispositivo_activo_idx" ON "UsuarioPushDispositivo"("activo");

-- AddForeignKey
ALTER TABLE "UsuarioPushDispositivo" ADD CONSTRAINT "UsuarioPushDispositivo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
