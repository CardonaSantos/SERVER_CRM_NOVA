import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

import { ValidacionGlobalPipe } from './validacion-global.pipe';

/** Registra el ValidationPipe global (observación/estricto). */
@Module({
  providers: [{ provide: APP_PIPE, useClass: ValidacionGlobalPipe }],
})
export class ValidacionModule {}
