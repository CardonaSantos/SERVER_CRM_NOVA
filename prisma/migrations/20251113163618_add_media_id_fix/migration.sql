/*
  Warnings:

  - You are about to drop the column `mediaId` on the `ContratoFisico` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ContratoFisico" DROP CONSTRAINT "ContratoFisico_mediaId_fkey";

-- AlterTable
ALTER TABLE "ContratoFisico" DROP COLUMN "mediaId";
