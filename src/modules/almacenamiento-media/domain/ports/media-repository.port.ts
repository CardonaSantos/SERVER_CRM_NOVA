import { MediaAsset } from '../props/media-asset.props';

export const MEDIA_REPOSITORY = Symbol('MEDIA_REPOSITORY');

export interface MediaRepositoryPort {
  /** Registra un archivo ya subido al almacenamiento. */
  guardar(asset: MediaAsset): Promise<MediaAsset>;

  /** Busca un archivo por id dentro de la empresa. */
  buscarPorId(id: number, empresaId: number): Promise<MediaAsset | null>;

  /** Borra la fila del archivo. */
  eliminar(id: number): Promise<void>;
}
