import { Module } from '@nestjs/common';
import { CreditoCronService } from './credito-cron.service';
import { CreditoCronController } from './credito-cron.controller';

@Module({
  controllers: [CreditoCronController],
  providers: [CreditoCronService],
})
export class CreditoCronModule {}
