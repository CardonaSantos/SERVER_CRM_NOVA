import { Module } from '@nestjs/common';
import { PerfilController } from './presentation/perfil.controller';
import { PerfilService } from './app/perfil.service';
import { DigitalOceanMediaModule } from 'src/modules/digital-ocean-media/digital-ocean-media.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaPerfilRepository } from './infraestructure/prisma-perfil.repository';
import { PERFIL_REPOSITORY } from './domain/perfil.repository';

@Module({
  imports: [DigitalOceanMediaModule, PrismaModule],
  controllers: [PerfilController],
  providers: [
    PerfilService,
    {
      useClass: PrismaPerfilRepository,
      provide: PERFIL_REPOSITORY,
    },
  ],
  exports: [PerfilService],
})
export class PerfilModule {}
