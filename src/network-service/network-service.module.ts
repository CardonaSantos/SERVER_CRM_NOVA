import { Module } from '@nestjs/common';
import { NetworkServiceService } from './network-service.service';
import { NetworkServiceController } from './network-service.controller';
import { SshMikrotikConnectionModule } from 'src/ssh-mikrotik-connection/ssh-mikrotik-connection.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [SshMikrotikConnectionModule, PrismaModule],
  controllers: [NetworkServiceController],
  providers: [NetworkServiceService],
  exports: [NetworkServiceService],
})
export class NetworkServiceModule {}
