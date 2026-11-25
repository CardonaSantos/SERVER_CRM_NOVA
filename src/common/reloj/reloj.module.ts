import { Global, Module } from '@nestjs/common';

import { RelojSistemaAdapter } from './reloj-sistema.adapter';
import { RELOJ } from './reloj.port';

/**
 * Global: cualquier caso de uso puede inyectar `@Inject(RELOJ)` sin
 * importar este módulo.
 */
@Global()
@Module({
  providers: [{ provide: RELOJ, useClass: RelojSistemaAdapter }],
  exports: [RELOJ],
})
export class RelojModule {}
