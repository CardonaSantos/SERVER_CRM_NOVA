import { Global, Module } from '@nestjs/common';

import { AutenticacionSocket } from './autenticacion-socket';
import { TiempoRealGateway } from './tiempo-real.gateway';
import { TIEMPO_REAL } from './tiempo-real.port';

/**
 * Global: cualquier adaptador puede inyectar `@Inject(TIEMPO_REAL)` sin
 * importar este módulo. JwtService y SesionesService también son globales.
 */
@Global()
@Module({
  providers: [
    AutenticacionSocket,
    TiempoRealGateway,
    { provide: TIEMPO_REAL, useExisting: TiempoRealGateway },
  ],
  exports: [TIEMPO_REAL],
})
export class TiempoRealModule {}
