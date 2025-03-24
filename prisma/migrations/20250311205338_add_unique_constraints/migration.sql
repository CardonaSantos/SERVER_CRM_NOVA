/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `Departamento` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre,departamentoId]` on the table `Municipio` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Departamento_nombre_key" ON "Departamento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Municipio_nombre_departamentoId_key" ON "Municipio"("nombre", "departamentoId");
