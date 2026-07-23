import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CLIENTE_PPPOE_CUENTA_REPOSITORY } from './domain/ports/pppoe-cliente-cuenta.port';
import { ClientePppoeCuentaPrismaRepository } from './infra/prisma/pppoe-cliente-cuenta.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: CLIENTE_PPPOE_CUENTA_REPOSITORY,
      useClass: ClientePppoeCuentaPrismaRepository,
    },
  ],
  exports: [CLIENTE_PPPOE_CUENTA_REPOSITORY],
})
export class PppoeClienteCuentaModule {}
