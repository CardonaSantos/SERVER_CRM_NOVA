import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { CLIENTE_PPPOE_CUENTA_REPOSITORY } from './domain/ports/pppoe-cliente-cuenta.port';

import { CLIENTE_PPPOE_CUENTA_QUERY } from './domain/ports/pppoe-cliente-cuenta-query.port';

import { ClientePppoeCuentaPrismaRepository } from './infra/prisma/pppoe-cliente-cuenta.repository';

import { ClientePppoeCuentaPrismaQueryRepository } from './infra/prisma/pppoe-cliente-cuenta-query.repository';

import { ListarCuentasPppoeUseCase } from './application/use-cases/listar-cuentas-pppoe.use-case';
import { AuthModule } from 'src/auth/auth.module';
import { PppoeCuentaConsultaController } from './presentation/pppoe-cuenta-consulta.controller';
import { ObtenerDetalleCuentaPppoeUseCase } from './application/use-cases/obtener-detalle-cuenta-pppoe.use-case';

@Module({
  imports: [PrismaModule, AuthModule],

  controllers: [PppoeCuentaConsultaController],

  providers: [
    ListarCuentasPppoeUseCase,
    ObtenerDetalleCuentaPppoeUseCase,
    {
      provide: CLIENTE_PPPOE_CUENTA_REPOSITORY,

      useClass: ClientePppoeCuentaPrismaRepository,
    },

    {
      provide: CLIENTE_PPPOE_CUENTA_QUERY,

      useClass: ClientePppoeCuentaPrismaQueryRepository,
    },
  ],

  exports: [CLIENTE_PPPOE_CUENTA_REPOSITORY],
})
export class PppoeClienteCuentaModule {}
