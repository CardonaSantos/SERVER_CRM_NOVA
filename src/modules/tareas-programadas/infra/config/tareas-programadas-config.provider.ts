import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  TAREAS_PROGRAMADAS_CONFIG,
  TareasProgramadasConfig,
} from '../../application/ports/tareas-programadas-config.port';

/** Solo el texto exacto `true` las enciende: cualquier otro valor las apaga. */
export const tareasProgramadasConfigProvider: Provider = {
  provide: TAREAS_PROGRAMADAS_CONFIG,
  inject: [ConfigService],
  useFactory: (config: ConfigService): TareasProgramadasConfig => ({
    activas:
      config.get<string>('TAREAS_PROGRAMADAS_ACTIVAS')?.trim().toLowerCase() ===
      'true',
  }),
};
