import { Module } from '@nestjs/common';
import { BroadcastController } from './presentation/broadcast.controller';
import { BroadcastService } from './app/broadcast.service';

@Module({
  controllers: [BroadcastController],
  providers: [BroadcastService],
})
export class BroadcastModule {}
