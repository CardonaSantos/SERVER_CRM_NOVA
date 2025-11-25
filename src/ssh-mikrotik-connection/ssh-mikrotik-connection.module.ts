import { Module } from '@nestjs/common';
import { SshMikrotikConnectionService } from './application/ssh-mikrotik-connection.service';
import { SshMikrotikConnectionController } from './presentation/ssh-mikrotik-connection.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MikrotikCryptoService } from './helpers/mikrotik-crypto.service';

@Module({
  controllers: [SshMikrotikConnectionController],
  providers: [
    SshMikrotikConnectionService,
    PrismaService,
    MikrotikCryptoService,
  ],
  // exports: [MikrotikCryptoService],
})
export class SshMikrotikConnectionModule {}
