/**
 * Configuración que necesitan los casos de uso. La arma
 * `infra/config/almacenamiento-media-config.provider.ts` desde el entorno.
 * Las credenciales del proveedor no pasan por aquí: las lee el adaptador.
 */
export const ALMACENAMIENTO_MEDIA_CONFIG = Symbol(
  'ALMACENAMIENTO_MEDIA_CONFIG',
);

export type AlmacenamientoMediaConfig = {
  /** Bucket donde se suben los archivos. */
  bucket: string;

  /** Base pública del CDN, sin `/` final. */
  cdnBase: string;

  /** Proveedor que se registra en `Media.provider` del dominio. */
  provider: string;

  /** Prefijo raíz por defecto de las rutas de `subirMedia`. */
  basePrefixPorDefecto: string;
};
