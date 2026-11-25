import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PPPOE_AUDITORIA_REPOSITORY } from './domain/ports/pppoe-auditoria-repository.port';
import { PppoeAuditoriaPrismaRepository } from './infra/prisma/pppoe-auditoria-prisma.repository';
import { PppoeAuditoriaService } from './application/services/pppoe-auditoria.service';
import { ListarPppoeAuditoriasUseCase } from './application/use-cases/listar-pppoe-auditorias.use-case';
import { PppoeAuditoriaController } from './presentation/http/pppoe-auditoria.controller';
import { PppoeAuditoriaInstalacionController } from './presentation/http/pppoe-auditoria-instalacion.controller';
import { ListarAuditoriaPppoeInstalacionUseCase } from './application/use-cases/listar-auditoria-pppoe-instalacion.use-case';
import { PPPOE_AUDITORIA_INSTALACION_QUERY } from './domain/ports/pppoe-auditoria-instalacion-query.port';
import { PppoeAuditoriaInstalacionPrismaQuery } from './infra/prisma/pppoe-auditoria-instalacion-prisma.query';

@Module({
  imports: [PrismaModule],
  controllers: [PppoeAuditoriaController, PppoeAuditoriaInstalacionController],
  providers: [
    PppoeAuditoriaService,
    ListarPppoeAuditoriasUseCase,
    ListarAuditoriaPppoeInstalacionUseCase,
    {
      provide: PPPOE_AUDITORIA_REPOSITORY,
      useClass: PppoeAuditoriaPrismaRepository,
    },
    {
      provide: PPPOE_AUDITORIA_INSTALACION_QUERY,
      useClass: PppoeAuditoriaInstalacionPrismaQuery,
    },
  ],

  exports: [PPPOE_AUDITORIA_REPOSITORY],
})
export class PppoeAuditoriaModule {}
