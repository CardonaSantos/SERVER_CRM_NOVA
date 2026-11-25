import { Module } from '@nestjs/common';
import { CLIENTE_ACCESO_INTERNET_REPOSITORY } from './domain/ports/cliente-acceso-internet-repository.port';
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
export class PppoeAccesoInternetModule {}
