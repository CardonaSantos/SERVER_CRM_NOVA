import { Module } from '@nestjs/common';
import { TagsTicketService } from './tags-ticket.service';
import { TagsTicketController } from './tags-ticket.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TagsTicketController],
  providers: [TagsTicketService, PrismaService],
})
export class TagsTicketModule {}
