import { Module } from '@nestjs/common';
import { ClienteInternetService } from './cliente-internet.service';
import { ClienteInternetController } from './cliente-internet.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { IdContratoService } from 'src/id-contrato/id-contrato.service';
import { SshMikrotikConnectionModule } from 'src/ssh-mikrotik-connection/ssh-mikrotik-connection.module';
import { NetworkServiceModule } from 'src/network-service/network-service.module';

@Module({
  imports: [SshMikrotikConnectionModule, NetworkServiceModule],
  controllers: [ClienteInternetController],
  providers: [ClienteInternetService, PrismaService, IdContratoService],
  exports: [ClienteInternetService],
})
export class ClienteInternetModule {}
