import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PPPOE_AUDITORIA_REPOSITORY } from './domain/ports/pppoe-auditoria-repository';
import { PppoeAuditoriaPrismaRepository } from './infra/prisma/pppoe-auditoria-prisma';
import { PppoeAuditoriaService } from './application/services/pppoe-auditoria.service';
import { ListarPppoeAuditoriasUseCase } from './application/use-cases/listar-pppoe-auditorias.use-case';
import { PppoeAuditoriaController } from './presentation/pppoe-auditoria.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PppoeAuditoriaController],
  providers: [
    PppoeAuditoriaService,
    ListarPppoeAuditoriasUseCase,
    {
      provide: PPPOE_AUDITORIA_REPOSITORY,
      useClass: PppoeAuditoriaPrismaRepository,
    },
  ],

  exports: [PPPOE_AUDITORIA_REPOSITORY],
})
export class PppoeAuditoriaModule {}
