import { Module } from '@nestjs/common';
import { PlantillaLegalService } from './app/plantilla-legal.service';
import { PlantillaLegalController } from './presentation/plantilla-legal.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PLANTILLA_LEGAL_REPOSITORY } from './domain/plantilla-legal.repository';
import { PrismaPlantillaLegalRepository } from './infraestructure/prisma-plantilla-legal.repository';

@Module({
  imports: [PrismaModule],
  controllers: [PlantillaLegalController],
  providers: [
    PlantillaLegalService,
    {
      provide: PLANTILLA_LEGAL_REPOSITORY,
      useClass: PrismaPlantillaLegalRepository,
    },
  ],
})
export class PlantillaLegalModule {}
