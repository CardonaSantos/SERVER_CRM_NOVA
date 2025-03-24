-- CreateEnum
CREATE TYPE "EstadoCobro" AS ENUM ('COBRADO', 'SIN_COBRAR');

-- CreateTable
CREATE TABLE "CobroRuta" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "rutaId" INTEGER NOT NULL,
    "montoCobrado" INTEGER NOT NULL,
    "estadoCobro" "EstadoCobro" NOT NULL,
    "fechaCobro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CobroRuta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CobroRuta" ADD CONSTRAINT "CobroRuta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobroRuta" ADD CONSTRAINT "CobroRuta_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
