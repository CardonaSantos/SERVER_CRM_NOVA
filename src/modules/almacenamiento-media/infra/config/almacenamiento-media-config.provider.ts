import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ALMACENAMIENTO_MEDIA_CONFIG,
  AlmacenamientoMediaConfig,
} from '../../application/ports/almacenamiento-media-config.port';

/**
 * ALMACENAMIENTO_MEDIA_CONFIG desde el entorno. Igual que antes, la app no
 * arranca si falta DO_SPACES_BUCKET o DO_SPACES_CDN_BASE.
 */
export const almacenamientoMediaConfigProvider: Provider = {
  provide: ALMACENAMIENTO_MEDIA_CONFIG,
  inject: [ConfigService],
  useFactory: (config: ConfigService): AlmacenamientoMediaConfig => {
    const bucket = config.get<string>('DO_SPACES_BUCKET');
    const cdnBase = config.get<string>('DO_SPACES_CDN_BASE');

    if (!bucket) throw new Error('Falta variable de entorno: DO_SPACES_BUCKET');
    if (!cdnBase) {
      throw new Error('Falta variable de entorno: DO_SPACES_CDN_BASE');
    }

    return {
      bucket,
      cdnBase,
      provider: 'do-spaces',
      basePrefixPorDefecto: config.get<string>('MEDIA_BASE_PREFIX') || 'crm',
    };
  },
};
