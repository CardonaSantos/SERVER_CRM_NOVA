import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { MikrotikRouterCredentialsModule } from 'src/modules/mikrotik-router-credentials/mikrotik-router-credentials.module';

import { MikroTikController } from './presentation/mikro-tik.controller';

import {
  MIKROTIK_ROUTER_CONNECTION_CONTEXT,
  MIKROTIK_ROUTER_REPOSITORY,
} from './infra/tokens/mikrotik-router.tokens';

import { CrearMikrotikRouterUseCase } from './application/use-cases/crear-mikrotik-router.use-case';

import { ActualizarMikrotikRouterUseCase } from './application/use-cases/actualizar-mikrotik-router.use-case';

import { ObtenerMikrotikRouterUseCase } from './application/use-cases/obtener-mikrotik-router.use-case';

import { ListarMikrotikRoutersUseCase } from './application/use-cases/listar-mikrotik-routers.use-case';

import { EliminarMikrotikRouterUseCase } from './application/use-cases/eliminar-mikrotik-router.use-case';

import { ResolverContextoConexionMikrotikUseCase } from './application/use-cases/resolver-contexto-conexion-mikrotik.use-case';
import { MikrotikRouterPrismaRepository } from './infra/mikrotik-router-prisma.repository';
import { RetirarMikrotikRouterUseCase } from './application/use-cases/retirar-mikrotik-router.use-case';
import { ReactivarMikrotikRouterUseCase } from './application/use-cases/reactivar-mikrotik-router.use-case';

const useCases = [
  CrearMikrotikRouterUseCase,

  ActualizarMikrotikRouterUseCase,

  ObtenerMikrotikRouterUseCase,

  ListarMikrotikRoutersUseCase,

  EliminarMikrotikRouterUseCase,

  ResolverContextoConexionMikrotikUseCase,

  RetirarMikrotikRouterUseCase,
  ReactivarMikrotikRouterUseCase,
];

@Module({
  imports: [PrismaModule, MikrotikRouterCredentialsModule],

  controllers: [MikroTikController],

  providers: [
    MikrotikRouterPrismaRepository,

    ...useCases,

    {
      provide: MIKROTIK_ROUTER_REPOSITORY,

      useExisting: MikrotikRouterPrismaRepository,
    },

    {
      provide: MIKROTIK_ROUTER_CONNECTION_CONTEXT,

      useExisting: ResolverContextoConexionMikrotikUseCase,
    },
  ],

  exports: [MIKROTIK_ROUTER_REPOSITORY, MIKROTIK_ROUTER_CONNECTION_CONTEXT],
})
export class MikroTikModule {}
