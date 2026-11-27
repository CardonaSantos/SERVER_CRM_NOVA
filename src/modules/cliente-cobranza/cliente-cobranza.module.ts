import { Module } from '@nestjs/common';
import { ClienteCobranzaFacade } from './application/facade/cliente-cobranza.facade';
import { ActualizarCobranzaClienteUseCase } from './application/use-cases/actualizar-cobranza-cliente.use-case';
import { BloquearCobranzaClienteUseCase } from './application/use-cases/bloquear-cobranza-cliente.use-case';
import { CLIENTE_COBRANZA_REPOSITORY } from './domain/ports/cliente-cobranza-repository.port';
import { ClienteCobranzaPrismaRepository } from './infra/prisma/cliente-cobranza-prisma.repository';
import { CLIENTE_COBRANZA } from './public/cliente-cobranza.facade.port';

/**
 * El estado de cobranza de cada cliente.
 *
 * API pública (`public/`): la fachada `CLIENTE_COBRANZA`.
 */
@Module({
  providers: [
    // Casos de uso
    BloquearCobranzaClienteUseCase,
    ActualizarCobranzaClienteUseCase,
    // Fachada
    ClienteCobranzaFacade,
    { provide: CLIENTE_COBRANZA, useExisting: ClienteCobranzaFacade },
    // Adaptadores
    {
      provide: CLIENTE_COBRANZA_REPOSITORY,
      useClass: ClienteCobranzaPrismaRepository,
    },
  ],
  exports: [CLIENTE_COBRANZA],
})
export class ClienteCobranzaModule {}
