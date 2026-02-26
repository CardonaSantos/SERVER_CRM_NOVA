/*
  Warnings:

  - You are about to drop the column `portada` on the `PerfilUsuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PerfilUsuario" DROP COLUMN "portada",
ADD COLUMN     "avatarBucket" TEXT,
ADD COLUMN     "avatarKey" TEXT,
ADD COLUMN     "avatarMimeType" TEXT,
ADD COLUMN     "avatarSize" INTEGER,
ADD COLUMN     "portadaBucket" TEXT,
ADD COLUMN     "portadaKey" TEXT,
ADD COLUMN     "portadaMimeType" TEXT,
ADD COLUMN     "portadaSize" INTEGER,
ADD COLUMN     "portadaUrl" TEXT;
