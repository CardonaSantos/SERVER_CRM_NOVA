import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ContratoClienteFacade } from './application/facade/contrato-cliente.facade';
import { CrearContratoClienteUseCase } from './application/use-cases/crear-contrato-cliente.use-case';
import { CrearPlantillaContratoUseCase } from './application/use-cases/crear-plantilla-contrato.use-case';
import { EditarPlantillaContratoUseCase } from './application/use-cases/editar-plantilla-contrato.use-case';
import { EliminarPlantillaContratoUseCase } from './application/use-cases/eliminar-plantilla-contrato.use-case';
import { GuardarContratoFisicoUseCase } from './application/use-cases/guardar-contrato-fisico.use-case';
import { ListarPlantillasContratoUseCase } from './application/use-cases/listar-plantillas-contrato.use-case';
import { ObtenerDocumentoContratoUseCase } from './application/use-cases/obtener-documento-contrato.use-case';
import { ObtenerPlantillaContratoUseCase } from './application/use-cases/obtener-plantilla-contrato.use-case';
import { CONTRATO_CLIENTE_REPOSITORY } from './domain/ports/contrato-cliente-repository.port';
import { CONTRATO_FISICO_REPOSITORY } from './domain/ports/contrato-fisico-repository.port';
import { DOCUMENTO_CONTRATO_QUERY } from './domain/ports/documento-contrato-query.port';
import { PLANTILLA_CONTRATO_QUERY } from './domain/ports/plantilla-contrato-query.port';
import { PLANTILLA_CONTRATO_REPOSITORY } from './domain/ports/plantilla-contrato-repository.port';
import { ContratoClientePrismaRepository } from './infra/prisma/contrato-cliente-prisma.repository';
import { ContratoFisicoPrismaRepository } from './infra/prisma/contrato-fisico-prisma.repository';
import { DocumentoContratoPrismaQuery } from './infra/prisma/documento-contrato-prisma.query';
import { PlantillaContratoPrismaQuery } from './infra/prisma/plantilla-contrato-prisma.query';
import { PlantillaContratoPrismaRepository } from './infra/prisma/plantilla-contrato-prisma.repository';
import { ContratoClienteController } from './presentation/http/contrato-cliente.controller';
import { PlantillaContratoController } from './presentation/http/plantilla-contrato.controller';
import { CONTRATO_CLIENTE } from './public/contrato-cliente.facade.port';

/**
 * Contratos de clientes: el de servicio, las plantillas con las que se arma el
 * documento de una instalación y el contrato en papel.
 *
 * API pública (`public/`): la fachada `CONTRATO_CLIENTE`.
 */
@Module({
  imports: [PrismaModule],
  controllers: [ContratoClienteController, PlantillaContratoController],
  providers: [
    // Casos de uso
    CrearContratoClienteUseCase,
    ObtenerDocumentoContratoUseCase,
    ListarPlantillasContratoUseCase,
    ObtenerPlantillaContratoUseCase,
    CrearPlantillaContratoUseCase,
    EditarPlantillaContratoUseCase,
    EliminarPlantillaContratoUseCase,
    GuardarContratoFisicoUseCase,
    // Fachada
    ContratoClienteFacade,
    { provide: CONTRATO_CLIENTE, useExisting: ContratoClienteFacade },
    // Adaptadores
    {
      provide: CONTRATO_CLIENTE_REPOSITORY,
      useClass: ContratoClientePrismaRepository,
    },
    {
      provide: CONTRATO_FISICO_REPOSITORY,
      useClass: ContratoFisicoPrismaRepository,
    },
    {
      provide: PLANTILLA_CONTRATO_REPOSITORY,
      useClass: PlantillaContratoPrismaRepository,
    },
    {
      provide: PLANTILLA_CONTRATO_QUERY,
      useClass: PlantillaContratoPrismaQuery,
    },
    {
      provide: DOCUMENTO_CONTRATO_QUERY,
      useClass: DocumentoContratoPrismaQuery,
    },
  ],
  exports: [CONTRATO_CLIENTE],
})
export class ContratoClienteModule {}
