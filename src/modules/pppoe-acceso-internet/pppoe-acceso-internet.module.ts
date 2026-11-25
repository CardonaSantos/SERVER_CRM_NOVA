import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { PppoeAccesoInternetFacade } from './application/facade/pppoe-acceso-internet.facade';
import { BuscarAccesoInternetUseCase } from './application/use-cases/buscar-acceso-internet.use-case';
import { CambiarEstadoAccesoInternetUseCase } from './application/use-cases/cambiar-estado-acceso-internet.use-case';
import { CrearAccesoInternetUseCase } from './application/use-cases/crear-acceso-internet.use-case';
import { RegistrarAccesoInternetAdoptadoUseCase } from './application/use-cases/registrar-acceso-internet-adoptado.use-case';
import { CLIENTE_ACCESO_INTERNET_REPOSITORY } from './domain/ports/cliente-acceso-internet-repository.port';
import { ClienteAccesoInternetPrismaRepository } from './infra/prisma/cliente-acceso-internet-prisma.repository';
import { PPPOE_ACCESO_INTERNET } from './public/pppoe-acceso-internet.facade.port';

/**
 * Acceso de internet de un cliente (ClienteAccesoInternet).
 *
 * API pública (`public/`): PPPOE_ACCESO_INTERNET y los tipos de
 * `pppoe-acceso-internet.types.ts`.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    // Casos de uso
    BuscarAccesoInternetUseCase,
    CrearAccesoInternetUseCase,
    RegistrarAccesoInternetAdoptadoUseCase,
    CambiarEstadoAccesoInternetUseCase,

    // Fachada
    PppoeAccesoInternetFacade,
    { provide: PPPOE_ACCESO_INTERNET, useExisting: PppoeAccesoInternetFacade },

    // Adaptadores
    {
      provide: CLIENTE_ACCESO_INTERNET_REPOSITORY,
      useClass: ClienteAccesoInternetPrismaRepository,
    },
  ],
  exports: [PPPOE_ACCESO_INTERNET],
})
export class PppoeAccesoInternetModule {}
