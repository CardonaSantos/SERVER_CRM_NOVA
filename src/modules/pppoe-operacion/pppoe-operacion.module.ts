import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { ActualizarPasoPppoeOperacionUseCase } from './application/use-cases/actualizar-paso-pppoe-operacion.use-case';
import { AutorizarPppoeOperacionUseCase } from './application/use-cases/autorizar-pppoe-operacion.use-case';
import { CancelarPppoeOperacionUseCase } from './application/use-cases/cancelar-pppoe-operacion.use-case';
import { CrearReintentoPppoeOperacionUseCase } from './application/use-cases/crear-reintento-pppoe-operacion.use-case';
import { FinalizarPppoeOperacionUseCase } from './application/use-cases/finalizar-pppoe-operacion.use-case';
import { IniciarPppoeOperacionUseCase } from './application/use-cases/iniciar-pppoe-operacion.use-case';
import { ListarPppoeOperacionesUseCase } from './application/use-cases/listar-pppoe-operaciones.use-case';
import { ObtenerDetallePppoeOperacionUseCase } from './application/use-cases/obtener-detalle-pppoe-operacion.use-case';

import { OPERADOR_REAUTENTICACION_PORT } from './domain/ports/operador-reautenticacion.port';
import { PPPOE_OPERACION_QUERY } from './domain/ports/pppoe-operacion-query.port';
import { PPPOE_OPERACION_REPOSITORY } from './domain/ports/pppoe-operacion-repository.port';

import { OperadorReautenticacionPrismaAdapter } from './infra/prisma/adapters/operador-reautenticacion-prisma.adapter';
import { PppoeOperacionPrismaRepository } from './infra/prisma/pppoe-operacion-prisma.repository';
import { CrearPppoeOperacionUseCase } from './application/use-cases/crear-pppoe-operacion.use-case.ts';

const useCases = [
  CrearPppoeOperacionUseCase,
  AutorizarPppoeOperacionUseCase,
  IniciarPppoeOperacionUseCase,
  ActualizarPasoPppoeOperacionUseCase,
  FinalizarPppoeOperacionUseCase,
  CancelarPppoeOperacionUseCase,
  CrearReintentoPppoeOperacionUseCase,
  ListarPppoeOperacionesUseCase,
  ObtenerDetallePppoeOperacionUseCase,
];

@Module({
  imports: [PrismaModule],

  providers: [
    /**
     * Implementaciones concretas.
     */
    PppoeOperacionPrismaRepository,
    OperadorReautenticacionPrismaAdapter,

    /**
     * Casos de uso.
     */
    ...useCases,

    {
      provide: PPPOE_OPERACION_REPOSITORY,
      useExisting: PppoeOperacionPrismaRepository,
    },

    /**
     * Puerto de consultas.
     */
    {
      provide: PPPOE_OPERACION_QUERY,
      useExisting: PppoeOperacionPrismaRepository,
    },

    /**
     * Puerto de reautenticación.
     */
    {
      provide: OPERADOR_REAUTENTICACION_PORT,
      useExisting: OperadorReautenticacionPrismaAdapter,
    },
  ],

  exports: [...useCases, PPPOE_OPERACION_REPOSITORY, PPPOE_OPERACION_QUERY],
})
export class PppoeOperacionModule {}
