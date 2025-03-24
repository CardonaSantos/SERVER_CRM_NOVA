import { Module } from '@nestjs/common';
import { RutaCobroService } from './ruta-cobro.service';
import { RutaCobroController } from './ruta-cobro.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [RutaCobroController],
  providers: [RutaCobroService, PrismaService],
})
export class RutaCobroModule {}
