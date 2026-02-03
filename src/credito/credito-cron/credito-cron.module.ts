import { Module } from '@nestjs/common';
import { CreditoCronService } from './app/credito-cron.service';
import { CreditoCronController } from './presentation/credito-cron.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CREDITO_CRON_REPOSITORY } from './domain/credito-cron.repository';
import { PrismaCreditoCronRepository } from './infraestructure/prisma-credito-cron.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CreditoCronController],
  providers: [
    CreditoCronService,
    {
      provide: CREDITO_CRON_REPOSITORY,
      useClass: PrismaCreditoCronRepository,
    },
  ],
})
export class CreditoCronModule {}
