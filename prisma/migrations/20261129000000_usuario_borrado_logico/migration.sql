-- Borrado lógico de usuarios. Solo agrega columnas opcionales: lo existente
-- queda vigente (eliminadoEn NULL). Al eliminar, el correo pasa a
-- correoEliminado y la columna única queda libre para reusarlo.

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "correoEliminado" TEXT,
ADD COLUMN     "eliminadoEn" TIMESTAMP(3),
ADD COLUMN     "eliminadoPorId" INTEGER;
