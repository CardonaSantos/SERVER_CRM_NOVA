/*
  Warnings:

  - Added the required column `bucket` to the `ClienteArchivo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `ClienteArchivo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `ClienteArchivo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `ClienteArchivo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClienteArchivo" ADD COLUMN     "bucket" TEXT NOT NULL,
ADD COLUMN     "eliminadoAt" TIMESTAMP(3),
ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'LISTO',
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL;
