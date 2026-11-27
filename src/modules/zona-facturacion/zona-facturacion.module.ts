import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ZonaFacturacionFacade } from './application/facade/zona-facturacion.facade';
import { ActualizarZonaFacturacionUseCase } from './application/use-cases/actualizar-zona-facturacion.use-case';
import { CrearZonaFacturacionUseCase } from './application/use-cases/crear-zona-facturacion.use-case';
import { EliminarZonaFacturacionUseCase } from './application/use-cases/eliminar-zona-facturacion.use-case';
import { ListarOpcionesZonaFacturacionUseCase } from './application/use-cases/listar-opciones-zona-facturacion.use-case';
import { ListarZonasFacturacionUseCase } from './application/use-cases/listar-zonas-facturacion.use-case';
import { VerificarZonaFacturacionAsignableUseCase } from './application/use-cases/verificar-zona-facturacion-asignable.use-case';
import { ZONA_FACTURACION_QUERY } from './domain/ports/zona-facturacion-query.port';
import { ZONA_FACTURACION_REPOSITORY } from './domain/ports/zona-facturacion-repository.port';
import { ZonaFacturacionPrismaQuery } from './infra/prisma/zona-facturacion-prisma.query';
import { ZonaFacturacionPrismaRepository } from './infra/prisma/zona-facturacion-prisma.repository';
import { ZonaFacturacionController } from './presentation/http/zona-facturacion.controller';
import { ZONA_FACTURACION } from './public/zona-facturacion.facade.port';

/**
 * Zonas de facturación: días del ciclo y avisos de cada grupo de clientes.
 *
 * API pública (`public/`): la fachada `ZONA_FACTURACION`.
 */
@Module({
  imports: [PrismaModule],
  controllers: [ZonaFacturacionController],
  providers: [
    // Casos de uso
    CrearZonaFacturacionUseCase,
    ActualizarZonaFacturacionUseCase,
    EliminarZonaFacturacionUseCase,
    ListarZonasFacturacionUseCase,
    ListarOpcionesZonaFacturacionUseCase,
    VerificarZonaFacturacionAsignableUseCase,
    // Fachada
    ZonaFacturacionFacade,
    { provide: ZONA_FACTURACION, useExisting: ZonaFacturacionFacade },
    // Adaptadores
    {
      provide: ZONA_FACTURACION_REPOSITORY,
      useClass: ZonaFacturacionPrismaRepository,
    },
    { provide: ZONA_FACTURACION_QUERY, useClass: ZonaFacturacionPrismaQuery },
  ],
  exports: [ZONA_FACTURACION],
})
export class ZonaFacturacionModule {}
