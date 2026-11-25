import { Global, Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { PrismaTransaccional } from './prisma-transaccional.service';
import { UNIDAD_DE_TRABAJO } from './unidad-de-trabajo.port';

/**
 * Global: los casos de uso inyectan `@Inject(UNIDAD_DE_TRABAJO)` y los
 * repositorios Prisma `PrismaTransaccional`, sin importar este módulo.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    PrismaTransaccional,
    { provide: UNIDAD_DE_TRABAJO, useExisting: PrismaTransaccional },
  ],
  exports: [PrismaTransaccional, UNIDAD_DE_TRABAJO],
})
export class TransaccionModule {}
