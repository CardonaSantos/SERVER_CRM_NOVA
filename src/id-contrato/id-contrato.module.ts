import { Module } from '@nestjs/common';
import { IdContratoService } from './id-contrato.service';
import { IdContratoController } from './id-contrato.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [IdContratoController],
  providers: [IdContratoService, PrismaService],
})
export class IdContratoModule {}
