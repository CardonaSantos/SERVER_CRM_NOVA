import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';
import { PPPOE_PERFIL_HOMOLOGACION_REPOSITORY } from './infra/tokens/ppoe-perfil-homologacion.token';
import { PerfilHomologacionPrismaRepository } from './infra/prisma/ppoe-perfil-homologacion.prisma.repository';

@Module({
  imports: [PrismaModule],

  providers: [
    {
      provide: PPPOE_PERFIL_HOMOLOGACION_REPOSITORY,

      useClass: PerfilHomologacionPrismaRepository,
    },
  ],
  exports: [PPPOE_PERFIL_HOMOLOGACION_REPOSITORY],
})
export class PppoePerfilHomologacionModule {}
