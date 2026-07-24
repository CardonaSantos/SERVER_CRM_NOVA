import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PPPOE_AUDITORIA_REPOSITORY } from './domain/ports/pppoe-auditoria-repository';
import { PppoeAuditoriaPrismaRepository } from './infra/prisma/pppoe-auditoria-prisma';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: PPPOE_AUDITORIA_REPOSITORY,
      useClass: PppoeAuditoriaPrismaRepository,
    },
  ],
  exports: [PPPOE_AUDITORIA_REPOSITORY],
})
export class PppoeAuditoriaModule {}
