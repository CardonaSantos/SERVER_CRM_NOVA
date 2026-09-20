-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AccionAuditoriaPppoe" ADD VALUE 'OPERACION_CREADA';
ALTER TYPE "AccionAuditoriaPppoe" ADD VALUE 'OPERACION_INICIADA';
ALTER TYPE "AccionAuditoriaPppoe" ADD VALUE 'OPERACION_REINTENTADA';
ALTER TYPE "AccionAuditoriaPppoe" ADD VALUE 'OPERACION_RECUPERADA';
ALTER TYPE "AccionAuditoriaPppoe" ADD VALUE 'OPERACION_EXITOSA';
ALTER TYPE "AccionAuditoriaPppoe" ADD VALUE 'OPERACION_CANCELADA';
