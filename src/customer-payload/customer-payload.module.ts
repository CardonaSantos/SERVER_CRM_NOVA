import { Module } from '@nestjs/common';
import { CustomerPayloadService } from './customer-payload.service';
import { CustomerPayloadController } from './customer-payload.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteInternetModule } from 'src/cliente-internet/cliente-internet.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [ClienteInternetModule, PrismaModule],
  controllers: [CustomerPayloadController],
  providers: [CustomerPayloadService],
})
export class CustomerPayloadModule {}
