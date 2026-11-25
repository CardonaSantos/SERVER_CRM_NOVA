import { MediaRepositoryPort } from '../../domain/ports/media-repository.port';
import { MediaAsset } from '../../domain/props/media-asset.props';

/** Repositorio de media en memoria para pruebas. */
export class MediaRepositoryFake implements MediaRepositoryPort {
  readonly filas = new Map<number, MediaAsset>();

  private siguienteId = 1;

  async guardar(asset: MediaAsset): Promise<MediaAsset> {
    const guardado = { ...asset, id: this.siguienteId++ };
    this.filas.set(guardado.id, guardado);
    return { ...guardado };
  }

  async buscarPorId(id: number, empresaId: number): Promise<MediaAsset | null> {
    const fila = this.filas.get(id);
    return fila && fila.empresaId === empresaId ? { ...fila } : null;
  }

  async eliminar(id: number): Promise<void> {
    this.filas.delete(id);
  }
}
