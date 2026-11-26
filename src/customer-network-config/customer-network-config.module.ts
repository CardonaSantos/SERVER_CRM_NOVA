import { Module } from '@nestjs/common';
import { CustomerNetworkConfigService } from './app/customer-network-config.service';
import { CustomerNetworkConfigController } from './presentation/customer-network-config.controller';
import { IPSymbol } from './domain/ip.repository';
import { PrismaIpRepository } from './infraestructure/prisma-ip-repository';
import { ClienteInternetModule } from 'src/cliente-internet/cliente-internet.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ClienteInternetModule],
  controllers: [CustomerNetworkConfigController],
  providers: [
    CustomerNetworkConfigService,
    {
      provide: IPSymbol,
      useClass: PrismaIpRepository,
    },
  ],
})
export class CustomerNetworkConfigModule {}
