import { Module } from '@nestjs/common';
import { OltService } from './olt.service';
import { OltController } from './olt.controller';

@Module({
  controllers: [OltController],
  providers: [OltService],
})
export class OltModule {}
