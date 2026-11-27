import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RutaCobroFacade } from './application/facade/ruta-cobro.facade';
import { RUTA_COBRO_EVENTOS } from './application/ports/ruta-cobro-eventos.port';
import { RUTA_COBRO_HOJA } from './application/ports/ruta-cobro-hoja.port';
import { ValidadorReferenciasRutaService } from './application/services/validador-referencias-ruta.service';
import { ActualizarRutaCobroUseCase } from './application/use-cases/actualizar-ruta-cobro.use-case';
import { CerrarRutaCobroUseCase } from './application/use-cases/cerrar-ruta-cobro.use-case';
import { CrearRutaCobroUseCase } from './application/use-cases/crear-ruta-cobro.use-case';
import { EliminarRutaCobroUseCase } from './application/use-cases/eliminar-ruta-cobro.use-case';
import { ExportarRutaCobroUseCase } from './application/use-cases/exportar-ruta-cobro.use-case';
import { ListarRutasAsignadasUseCase } from './application/use-cases/listar-rutas-asignadas.use-case';
import { ListarRutasCobroUseCase } from './application/use-cases/listar-rutas-cobro.use-case';
import { ObtenerRutaCobroUseCase } from './application/use-cases/obtener-ruta-cobro.use-case';
import { VerificarCobroRutaUseCase } from './application/use-cases/verificar-cobro-ruta.use-case';
import { REFERENCIA_RUTA_QUERY } from './domain/ports/referencia-ruta-query.port';
import { RUTA_COBRO_QUERY } from './domain/ports/ruta-cobro-query.port';
import { RUTA_COBRO_REPOSITORY } from './domain/ports/ruta-cobro-repository.port';
import { ReferenciaRutaPrismaQuery } from './infra/prisma/referencia-ruta-prisma.query';
import { RutaCobroPrismaQuery } from './infra/prisma/ruta-cobro-prisma.query';
import { RutaCobroPrismaRepository } from './infra/prisma/ruta-cobro-prisma.repository';
import { RutaCobroEventosWebsocketAdapter } from './infra/websocket/ruta-cobro-eventos-websocket.adapter';
import { RutaCobroHojaXlsxAdapter } from './infra/xlsx/ruta-cobro-hoja-xlsx.adapter';
import { RutaCobroController } from './presentation/http/ruta-cobro.controller';
import { RUTA_COBRO } from './public/ruta-cobro.facade.port';

/**
 * Rutas de cobro en calle: qué clientes visita cada cobrador, lo que deben y
 * lo cobrado.
 *
 * API pública (`public/`): la fachada `RUTA_COBRO`.
 */
@Module({
  imports: [PrismaModule],
  controllers: [RutaCobroController],
  providers: [
    // Casos de uso
    CrearRutaCobroUseCase,
    ActualizarRutaCobroUseCase,
    CerrarRutaCobroUseCase,
    EliminarRutaCobroUseCase,
    ListarRutasCobroUseCase,
    ListarRutasAsignadasUseCase,
    ObtenerRutaCobroUseCase,
    ExportarRutaCobroUseCase,
    VerificarCobroRutaUseCase,
    // Services
    ValidadorReferenciasRutaService,
    // Fachada
    RutaCobroFacade,
    { provide: RUTA_COBRO, useExisting: RutaCobroFacade },
    // Adaptadores
    { provide: RUTA_COBRO_REPOSITORY, useClass: RutaCobroPrismaRepository },
    { provide: RUTA_COBRO_QUERY, useClass: RutaCobroPrismaQuery },
    { provide: REFERENCIA_RUTA_QUERY, useClass: ReferenciaRutaPrismaQuery },
    { provide: RUTA_COBRO_EVENTOS, useClass: RutaCobroEventosWebsocketAdapter },
    { provide: RUTA_COBRO_HOJA, useClass: RutaCobroHojaXlsxAdapter },
  ],
  exports: [RUTA_COBRO],
})
export class RutaCobroModule {}
