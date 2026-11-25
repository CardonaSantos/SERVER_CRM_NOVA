// src/modules/media/domain/ports/media-repository.port.ts

import { MediaAsset } from '../file-aset';

export type ListarMediaFiltro = {
  empresaId: number;
  clienteId?: number;
  albumId?: number;
  tipo?: MediaAsset['tipo'];
  skip?: number;
  take?: number;
};

export interface MediaRepositoryPort {
  guardar(asset: MediaAsset): Promise<MediaAsset>;
  buscarPorId(id: number, empresaId: number): Promise<MediaAsset | null>;
  listar(f: ListarMediaFiltro): Promise<MediaAsset[]>;
  marcarEliminado(id: number, empresaId: number, fecha: Date): Promise<void>;
  existePorBucketKey(bucket: string, key: string): Promise<boolean>;
  eliminar(id: number, empresaId: number): Promise<void>;
}
