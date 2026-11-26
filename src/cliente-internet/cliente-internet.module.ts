import { Module } from '@nestjs/common';
import { ClienteInternetService } from './cliente-internet.service';
import { ClienteInternetController } from './cliente-internet.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { IdContratoService } from 'src/id-contrato/id-contrato.service';
import { VerifyCustomerModule } from 'src/credito/verify-customer/verify-customer.module';

@Module({
  imports: [VerifyCustomerModule],
  controllers: [ClienteInternetController],
  providers: [ClienteInternetService, PrismaService, IdContratoService],
  exports: [ClienteInternetService],
})
export class ClienteInternetModule {}
