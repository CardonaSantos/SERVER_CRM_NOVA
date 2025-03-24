/*
  Warnings:

  - You are about to drop the column `mediosNotificacion` on the `FacturacionZona` table. All the data in the column will be lost.
  - Added the required column `diaSegundoRecordatorio` to the `FacturacionZona` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `FacturacionZona` table without a default value. This is not possible if the table is not empty.
  - Added the required column `llamada` to the `FacturacionZona` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sms` to the `FacturacionZona` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telegram` to the `FacturacionZona` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsapp` to the `FacturacionZona` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FacturacionZona" DROP COLUMN "mediosNotificacion",
ADD COLUMN     "diaSegundoRecordatorio" INTEGER NOT NULL,
ADD COLUMN     "email" BOOLEAN NOT NULL,
ADD COLUMN     "llamada" BOOLEAN NOT NULL,
ADD COLUMN     "sms" BOOLEAN NOT NULL,
ADD COLUMN     "telegram" BOOLEAN NOT NULL,
ADD COLUMN     "whatsapp" BOOLEAN NOT NULL;
