import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { FiltroGlobalExcepciones } from './filtro-global-excepciones';

/** Registra el filtro global de excepciones. */
@Module({
  providers: [{ provide: APP_FILTER, useClass: FiltroGlobalExcepciones }],
})
export class ExcepcionesModule {}
