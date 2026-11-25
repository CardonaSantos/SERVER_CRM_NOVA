import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { PppoeAuditoriaFacade } from './application/facade/pppoe-auditoria.facade';
import { RangoFechasAuditoriaService } from './application/services/rango-fechas-auditoria.service';
import { ListarAuditoriaPppoeInstalacionUseCase } from './application/use-cases/listar-auditoria-pppoe-instalacion.use-case';
import { ListarPppoeAuditoriasUseCase } from './application/use-cases/listar-pppoe-auditorias.use-case';
import { RegistrarAuditoriaPppoeUseCase } from './application/use-cases/registrar-auditoria-pppoe.use-case';
import { PPPOE_AUDITORIA_INSTALACION_QUERY } from './domain/ports/pppoe-auditoria-instalacion-query.port';
import { PPPOE_AUDITORIA_REPOSITORY } from './domain/ports/pppoe-auditoria-repository.port';
import { PppoeAuditoriaInstalacionPrismaQuery } from './infra/prisma/pppoe-auditoria-instalacion-prisma.query';
import { PppoeAuditoriaPrismaRepository } from './infra/prisma/pppoe-auditoria-prisma.repository';
import { PppoeAuditoriaInstalacionController } from './presentation/http/pppoe-auditoria-instalacion.controller';
import { PppoeAuditoriaController } from './presentation/http/pppoe-auditoria.controller';
import { PPPOE_AUDITORIA } from './public/pppoe-auditoria.facade.port';

/**
 * Bitácora PPPoE (append-only).
 *
 * API pública (`public/`): PPPOE_AUDITORIA (registrar eventos) y los enums
 * de `pppoe-auditoria.types.ts`.
 */
@Module({
  imports: [PrismaModule],
  controllers: [PppoeAuditoriaController, PppoeAuditoriaInstalacionController],
  providers: [
    // Casos de uso
    RegistrarAuditoriaPppoeUseCase,
    ListarPppoeAuditoriasUseCase,
    ListarAuditoriaPppoeInstalacionUseCase,

    // Servicios
    RangoFechasAuditoriaService,

    // Fachada
    PppoeAuditoriaFacade,
    { provide: PPPOE_AUDITORIA, useExisting: PppoeAuditoriaFacade },

    // Adaptadores
    {
      provide: PPPOE_AUDITORIA_REPOSITORY,
      useClass: PppoeAuditoriaPrismaRepository,
    },
    {
      provide: PPPOE_AUDITORIA_INSTALACION_QUERY,
      useClass: PppoeAuditoriaInstalacionPrismaQuery,
    },
  ],
  exports: [PPPOE_AUDITORIA],
})
export class PppoeAuditoriaModule {}
