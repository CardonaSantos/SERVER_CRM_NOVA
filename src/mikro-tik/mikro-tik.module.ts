import { Module } from '@nestjs/common';
import { MikroTikService } from './mikro-tik.service';
import { MikroTikController } from './mikro-tik.controller';

@Module({
  controllers: [MikroTikController],
  providers: [MikroTikService],
})
export class MikroTikModule {}
