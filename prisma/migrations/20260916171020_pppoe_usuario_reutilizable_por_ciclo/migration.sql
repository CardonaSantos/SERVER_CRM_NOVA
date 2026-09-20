-- DropIndex
DROP INDEX "public"."ClientePppoeCuenta_empresaId_usuario_key";

-- CreateIndex
CREATE INDEX "ClientePppoeCuenta_empresaId_usuario_idx" ON "ClientePppoeCuenta"("empresaId", "usuario");
