import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { PppoeAuditoriaModule } from '../pppoe-auditoria/pppoe-auditoria.module';
import { PppoeCredentialsModule } from '../pppoe-credentials/pppoe-credentials.module';

import { PppoeClienteCuentaFacade } from './application/facade/pppoe-cliente-cuenta.facade';
import { BuscarCuentaPppoeUseCase } from './application/use-cases/buscar-cuenta-pppoe.use-case';
import { CambiarEstadoCuentaPppoeUseCase } from './application/use-cases/cambiar-estado-cuenta-pppoe.use-case';
import { ConsultarCredencialesPppoeCuentaUseCase } from './application/use-cases/consultar-credenciales-pppoe-cuenta.use-case';
import { ConsultarCredencialesPppoeInstalacionUseCase } from './application/use-cases/consultar-credenciales-pppoe-instalacion.use-case';
import { CrearCuentaPppoeUseCase } from './application/use-cases/crear-cuenta-pppoe.use-case';
import { ListarCuentasPppoeUseCase } from './application/use-cases/listar-cuentas-pppoe.use-case';
import { ObtenerDetalleCuentaPppoeUseCase } from './application/use-cases/obtener-detalle-cuenta-pppoe.use-case';
import { RegistrarErrorCuentaPppoeUseCase } from './application/use-cases/registrar-error-cuenta-pppoe.use-case';
import { CLIENTE_PPPOE_CUENTA_QUERY } from './domain/ports/cliente-pppoe-cuenta-query.port';
import { CLIENTE_PPPOE_CUENTA_REPOSITORY } from './domain/ports/cliente-pppoe-cuenta-repository.port';
import { ClientePppoeCuentaPrismaQuery } from './infra/prisma/cliente-pppoe-cuenta-prisma.query';
import { ClientePppoeCuentaPrismaRepository } from './infra/prisma/cliente-pppoe-cuenta-prisma.repository';
import { CuentaPppoeController } from './presentation/http/cuenta-pppoe.controller';
import { PPPOE_CLIENTE_CUENTA } from './public/pppoe-cliente-cuenta.facade.port';

/**
 * Cuenta PPPoE de un cliente (ClientePppoeCuenta).
 *
 * API pública (`public/`): PPPOE_CLIENTE_CUENTA y los tipos de
 * `pppoe-cliente-cuenta.types.ts`.
 */
@Module({
  imports: [PrismaModule, PppoeCredentialsModule, PppoeAuditoriaModule],
  controllers: [CuentaPppoeController],
  providers: [
    // Casos de uso
    ListarCuentasPppoeUseCase,
    ObtenerDetalleCuentaPppoeUseCase,
    ConsultarCredencialesPppoeCuentaUseCase,
    ConsultarCredencialesPppoeInstalacionUseCase,
    BuscarCuentaPppoeUseCase,
    CrearCuentaPppoeUseCase,
    CambiarEstadoCuentaPppoeUseCase,
    RegistrarErrorCuentaPppoeUseCase,

    // Fachada
    PppoeClienteCuentaFacade,
    { provide: PPPOE_CLIENTE_CUENTA, useExisting: PppoeClienteCuentaFacade },

    // Adaptadores
    {
      provide: CLIENTE_PPPOE_CUENTA_REPOSITORY,
      useClass: ClientePppoeCuentaPrismaRepository,
    },
    {
      provide: CLIENTE_PPPOE_CUENTA_QUERY,
      useClass: ClientePppoeCuentaPrismaQuery,
    },
  ],
  exports: [PPPOE_CLIENTE_CUENTA],
})
export class PppoeClienteCuentaModule {}
