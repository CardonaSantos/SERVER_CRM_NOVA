-- Sesión que registró el dispositivo push: al revocarla, el dispositivo se desactiva.
ALTER TABLE "UsuarioPushDispositivo" ADD COLUMN     "sesionId" TEXT;

CREATE INDEX "UsuarioPushDispositivo_sesionId_idx" ON "UsuarioPushDispositivo"("sesionId");
