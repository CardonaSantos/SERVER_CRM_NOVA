import { Module } from '@nestjs/common';
import { CLIENTE_ACCESO_INTERNET_REPOSITORY } from './infra/tokens/token-ppoe-acceso-internet.token';
import { ClienteAccesoInternetPrismaRepository } from './infra/prisma/cliente-acceso-internet-prisma.repository';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    {
      provide: CLIENTE_ACCESO_INTERNET_REPOSITORY,
      useClass: ClienteAccesoInternetPrismaRepository,
    },
  ],
  exports: [CLIENTE_ACCESO_INTERNET_REPOSITORY],
})
export class PpoeAccesoInternetModule {}
