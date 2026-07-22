import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';
import { CLIENTE_INSTALACION_ACCESO_REPOSITORY } from './tokens/instalacion-acceso.token';
import { ClienteInstalacionAccesoPrismaRepository } from './infra/prisma/cliente-instalacion-acceso.repository.prisma';

@Module({
  imports: [PrismaModule],

  providers: [
    {
      provide: CLIENTE_INSTALACION_ACCESO_REPOSITORY,
      useClass: ClienteInstalacionAccesoPrismaRepository,
    },
  ],

  exports: [CLIENTE_INSTALACION_ACCESO_REPOSITORY],
})
export class PpoeInstalacionAccesoModule {}
