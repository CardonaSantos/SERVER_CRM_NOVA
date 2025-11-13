import { MediaAsset } from '../file-aset';

export interface AssetRepositoryPort {
  save(asset: MediaAsset): Promise<void>;
  findById(id: string): Promise<MediaAsset | null>;
}
