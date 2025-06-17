import { Module } from '@nestjs/common';
import { MetasTicketsService } from './metas-tickets.service';
import { MetasTicketsController } from './metas-tickets.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [MetasTicketsController],
  providers: [MetasTicketsService, PrismaService],
})
export class MetasTicketsModule {}
