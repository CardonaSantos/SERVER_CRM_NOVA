import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  TAREAS_PROGRAMADAS_CONFIG,
  TareasProgramadasConfig,
} from '../../application/ports/tareas-programadas-config.port';

/** Solo el texto exacto `true` las enciende: cualquier otro valor las apaga. */
export const tareasProgramadasConfigProvider: Provider = {
  provide: TAREAS_PROGRAMADAS_CONFIG,
  inject: [ConfigService],
  useFactory: (config: ConfigService): TareasProgramadasConfig => {
    const activas =
      config.get<string>('TAREAS_PROGRAMADAS_ACTIVAS')?.trim().toLowerCase() ===
      'true';
    if (!activas) {
      // En producción esto significa que no se factura ni se envían avisos.
      new Logger('TareasProgramadas').warn(
        'TAREAS_PROGRAMADAS_ACTIVAS no está en true: no corre ninguna tarea programada (jornada de facturación, recordatorios, mora de crédito ni cierre de recorridos).',
      );
    }
    return { activas };
  },
};
