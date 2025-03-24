/*
  Warnings:

  - You are about to drop the column `EmpresaId` on the `Ruta` table. All the data in the column will be lost.
  - Added the required column `empresaId` to the `Ruta` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Ruta" DROP CONSTRAINT "Ruta_EmpresaId_fkey";

-- AlterTable
ALTER TABLE "Ruta" DROP COLUMN "EmpresaId",
ADD COLUMN     "empresaId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Ruta" ADD CONSTRAINT "Ruta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
