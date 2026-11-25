import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { PppoeOperacionFacade } from './application/facade/pppoe-operacion.facade';
import { OPERADOR_REAUTENTICACION } from './application/ports/operador-reautenticacion.port';
import { ActualizarPasoPppoeOperacionUseCase } from './application/use-cases/actualizar-paso-pppoe-operacion.use-case';
import { AutorizarPppoeOperacionUseCase } from './application/use-cases/autorizar-pppoe-operacion.use-case';
import { BuscarAgregadoPppoeOperacionUseCase } from './application/use-cases/buscar-agregado-pppoe-operacion.use-case';
import { BuscarPppoeOperacionUseCase } from './application/use-cases/buscar-pppoe-operacion.use-case';
import { CancelarPppoeOperacionUseCase } from './application/use-cases/cancelar-pppoe-operacion.use-case';
import { CrearPppoeOperacionUseCase } from './application/use-cases/crear-pppoe-operacion.use-case';
import { CrearReintentoPppoeOperacionUseCase } from './application/use-cases/crear-reintento-pppoe-operacion.use-case';
import { FinalizarPppoeOperacionUseCase } from './application/use-cases/finalizar-pppoe-operacion.use-case';
import { IniciarPppoeOperacionUseCase } from './application/use-cases/iniciar-pppoe-operacion.use-case';
import { ListarPppoeOperacionesUseCase } from './application/use-cases/listar-pppoe-operaciones.use-case';
import { ObtenerDetallePppoeOperacionUseCase } from './application/use-cases/obtener-detalle-pppoe-operacion.use-case';
import { PPPOE_OPERACION_QUERY } from './domain/ports/pppoe-operacion-query.port';
import { PPPOE_OPERACION_REPOSITORY } from './domain/ports/pppoe-operacion-repository.port';
import { OperadorReautenticacionPrismaAdapter } from './infra/prisma/operador-reautenticacion-prisma.adapter';
import { PppoeOperacionPrismaQuery } from './infra/prisma/pppoe-operacion-prisma.query';
import { PppoeOperacionPrismaRepository } from './infra/prisma/pppoe-operacion-prisma.repository';
import { PPPOE_OPERACION } from './public/pppoe-operacion.facade.port';

@Module({
  imports: [PrismaModule],
  providers: [
    CrearPppoeOperacionUseCase,
    AutorizarPppoeOperacionUseCase,
    IniciarPppoeOperacionUseCase,
    ActualizarPasoPppoeOperacionUseCase,
    FinalizarPppoeOperacionUseCase,
    CancelarPppoeOperacionUseCase,
    CrearReintentoPppoeOperacionUseCase,
    ListarPppoeOperacionesUseCase,
    ObtenerDetallePppoeOperacionUseCase,
    BuscarPppoeOperacionUseCase,
    BuscarAgregadoPppoeOperacionUseCase,

    PppoeOperacionFacade,
    { provide: PPPOE_OPERACION, useExisting: PppoeOperacionFacade },

    {
      provide: PPPOE_OPERACION_REPOSITORY,
      useClass: PppoeOperacionPrismaRepository,
    },
    { provide: PPPOE_OPERACION_QUERY, useClass: PppoeOperacionPrismaQuery },
    {
      provide: OPERADOR_REAUTENTICACION,
      useClass: OperadorReautenticacionPrismaAdapter,
    },
  ],
  exports: [PPPOE_OPERACION],
})
export class PppoeOperacionModule {}
