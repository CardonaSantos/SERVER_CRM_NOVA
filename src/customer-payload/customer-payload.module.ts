import { Module } from '@nestjs/common';
import { CustomerPayloadService } from './customer-payload.service';
import { CustomerPayloadController } from './customer-payload.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteInternetService } from 'src/cliente-internet/cliente-internet.service';
import { IdContratoService } from 'src/id-contrato/id-contrato.service';

@Module({
  controllers: [CustomerPayloadController],
  providers: [
    CustomerPayloadService,
    PrismaService,
    ClienteInternetService,
    IdContratoService,
  ],
})
export class CustomerPayloadModule {}
