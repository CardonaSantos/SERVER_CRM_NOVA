import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PppoeAccesoInternetModule } from '../pppoe-acceso-internet/pppoe-acceso-internet.module';
import { ClienteFacade } from './application/facade/cliente.facade';
import { CONTRATO_FISICO } from './application/ports/contrato-fisico.port';
import { PRIMERA_FACTURA } from './application/ports/primera-factura.port';
import { ActualizarClienteUseCase } from './application/use-cases/actualizar-cliente.use-case';
import { ActualizarIpClienteUseCase } from './application/use-cases/actualizar-ip-cliente.use-case';
import { CrearClienteUseCase } from './application/use-cases/crear-cliente.use-case';
import { EliminarClienteUseCase } from './application/use-cases/eliminar-cliente.use-case';
import { MarcarClienteDesinstaladoUseCase } from './application/use-cases/marcar-cliente-desinstalado.use-case';
import { SincronizarEstadoOperativoClienteUseCase } from './application/use-cases/sincronizar-estado-operativo-cliente.use-case';
import { CLIENTE_REPOSITORY } from './domain/ports/cliente-repository.port';
import { ClientePrismaRepository } from './infra/prisma/cliente-prisma.repository';
import { ContratoFisicoPrismaAdapter } from './infra/prisma/contrato-fisico-prisma.adapter';
import { PrimeraFacturaPrismaAdapter } from './infra/prisma/primera-factura-prisma.adapter';
import { ClienteRedController } from './presentation/http/cliente-red.controller';
import { ClienteController } from './presentation/http/cliente.controller';
import { CLIENTE } from './public/cliente.facade.port';

/**
 * Clientes de internet.
 *
 * API pública (`public/`): la fachada `CLIENTE` y sus tipos.
 */
@Module({
  imports: [PrismaModule, PppoeAccesoInternetModule],
  controllers: [ClienteController, ClienteRedController],
  providers: [
    // Casos de uso
    CrearClienteUseCase,
    ActualizarClienteUseCase,
    ActualizarIpClienteUseCase,
    EliminarClienteUseCase,
    SincronizarEstadoOperativoClienteUseCase,
    MarcarClienteDesinstaladoUseCase,
    // Fachada
    ClienteFacade,
    { provide: CLIENTE, useExisting: ClienteFacade },
    // Adaptadores
    { provide: CLIENTE_REPOSITORY, useClass: ClientePrismaRepository },
    { provide: CONTRATO_FISICO, useClass: ContratoFisicoPrismaAdapter },
    { provide: PRIMERA_FACTURA, useClass: PrimeraFacturaPrismaAdapter },
  ],
  exports: [CLIENTE],
})
export class ClienteModule {}
