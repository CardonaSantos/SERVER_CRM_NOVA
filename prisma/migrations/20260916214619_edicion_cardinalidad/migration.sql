/*
  Warnings:

  - A unique constraint covering the columns `[instalacionId]` on the table `ClienteInstalacionAcceso` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."ClienteInstalacionAcceso_instalacionId_accesoInternetId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ClienteInstalacionAcceso_instalacionId_key" ON "ClienteInstalacionAcceso"("instalacionId");
