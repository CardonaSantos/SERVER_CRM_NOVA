import { Module } from '@nestjs/common';

import { SshMikrotikConnectionService } from './application/ssh-mikrotik-connection.service';

import { SshMikrotikConnectionController } from './presentation/ssh-mikrotik-connection.controller';

import { PrismaService } from 'src/prisma/prisma.service';

import { MikroTikModule } from 'src/mikro-tik/mikro-tik.module';

@Module({
  imports: [MikroTikModule],

  controllers: [SshMikrotikConnectionController],

  providers: [SshMikrotikConnectionService, PrismaService],

  exports: [SshMikrotikConnectionService],
})
export class SshMikrotikConnectionModule {}
