import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ActualizarEmpresaUseCase } from './application/use-cases/actualizar-empresa.use-case';
import { ObtenerEmpresaUseCase } from './application/use-cases/obtener-empresa.use-case';
import { EMPRESA_REPOSITORY } from './domain/ports/empresa-repository.port';
import { EmpresaPrismaRepository } from './infra/prisma/empresa-prisma.repository';
import { EmpresaController } from './presentation/http/empresa.controller';

/**
 * Datos de la empresa de la instalación (una por base de datos). Otros módulos
 * solo la leen, así que no publica fachada.
 */
@Module({
  imports: [PrismaModule],
  controllers: [EmpresaController],
  providers: [
    // Casos de uso
    ObtenerEmpresaUseCase,
    ActualizarEmpresaUseCase,
    // Adaptadores
    { provide: EMPRESA_REPOSITORY, useClass: EmpresaPrismaRepository },
  ],
})
export class EmpresaModule {}
