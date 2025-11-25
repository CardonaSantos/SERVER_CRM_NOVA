import { Module } from '@nestjs/common';
import { MikroTikService } from './application/mikro-tik.service';
import { MikroTikController } from './presentation/mikro-tik.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MikrotikRouterRepository } from './domain/mikrotik-repository';
import { MikrotikRouterPrisma } from './infraestructure/mikrotik.repository';
import { MikrotikCryptoService } from 'src/ssh-mikrotik-connection/helpers/mikrotik-crypto.service';

@Module({
  controllers: [MikroTikController],
  providers: [
    MikroTikService,
    PrismaService,
    MikrotikCryptoService,
    {
      provide: MikrotikRouterRepository,
      useClass: MikrotikRouterPrisma,
    },
  ],
})
export class MikroTikModule {}
