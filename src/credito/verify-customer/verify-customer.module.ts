import { Module } from '@nestjs/common';
import { VerifyCustomerService } from './app/verify-customer.service';
import { VerifyCustomerController } from './presentation/verify-customer.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaVerifyCustomerRepository } from './infraestructure/prisma-verify-customer.repo';
import { VERIFY_CUSTOMER_REPOSITORY } from './domain/verify-customer.repo';

@Module({
  imports: [PrismaModule],
  controllers: [VerifyCustomerController],
  providers: [
    VerifyCustomerService,
    {
      useClass: PrismaVerifyCustomerRepository,
      provide: VERIFY_CUSTOMER_REPOSITORY,
    },
  ],
})
export class VerifyCustomerModule {}
