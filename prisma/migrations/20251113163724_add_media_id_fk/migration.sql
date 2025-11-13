-- AlterTable
ALTER TABLE "ContratoFisico" ADD COLUMN     "mediaId" INTEGER;

-- AddForeignKey
ALTER TABLE "ContratoFisico" ADD CONSTRAINT "ContratoFisico_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
