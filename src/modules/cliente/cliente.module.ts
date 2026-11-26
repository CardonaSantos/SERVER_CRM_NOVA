import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PppoeAccesoInternetModule } from '../pppoe-acceso-internet/pppoe-acceso-internet.module';
import { ClienteFacade } from './application/facade/cliente.facade';
import { EliminarClienteUseCase } from './application/use-cases/eliminar-cliente.use-case';
import { MarcarClienteDesinstaladoUseCase } from './application/use-cases/marcar-cliente-desinstalado.use-case';
import { SincronizarEstadoOperativoClienteUseCase } from './application/use-cases/sincronizar-estado-operativo-cliente.use-case';
import { CLIENTE_REPOSITORY } from './domain/ports/cliente-repository.port';
import { ClientePrismaRepository } from './infra/prisma/cliente-prisma.repository';
import { ClienteController } from './presentation/http/cliente.controller';
import { CLIENTE } from './public/cliente.facade.port';

/**
 * Clientes de internet.
 *
 * API pública (`public/`): la fachada `CLIENTE` y sus tipos.
 */
@Module({
  imports: [PrismaModule, PppoeAccesoInternetModule],
  controllers: [ClienteController],
  providers: [
    // Casos de uso
    EliminarClienteUseCase,
    SincronizarEstadoOperativoClienteUseCase,
    MarcarClienteDesinstaladoUseCase,
    // Fachada
    ClienteFacade,
    { provide: CLIENTE, useExisting: ClienteFacade },
    // Adaptadores
    { provide: CLIENTE_REPOSITORY, useClass: ClientePrismaRepository },
  ],
  exports: [CLIENTE],
})
export class ClienteModule {}
