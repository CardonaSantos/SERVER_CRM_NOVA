import { Module } from '@nestjs/common';
import { MensajeService } from './mensaje.service';
import { MensajeController } from './mensaje.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [MensajeController],
  providers: [MensajeService, PrismaService],
})
export class MensajeModule {}
