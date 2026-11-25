import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import {
  ArchivoVacioError,
  MediaNoEncontradaError,
} from '../../domain/errors/almacenamiento-media.errors';
import { CategoriaMedia, TipoMedia } from '../../domain/enums/media.enum';
import { FileStorageFake } from '../../test/fakes/file-storage.fake';
import { MediaRepositoryFake } from '../../test/fakes/media-repository.fake';
import { AlmacenamientoMediaConfig } from '../ports/almacenamiento-media-config.port';
import { MediaKeyService } from '../services/media-key.service';

import { EliminarMediaUseCase } from './eliminar-media.use-case';
import { SubirArchivoUseCase } from './subir-archivo.use-case';
import { SubirMediaUseCase } from './subir-media.use-case';

const config: AlmacenamientoMediaConfig = {
  bucket: 'bucket-crm',
  cdnBase: 'https://cdn.prueba',
  provider: 'do-spaces',
  basePrefixPorDefecto: 'crm',
};

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

function preparar() {
  const storage = new FileStorageFake();
  const repo = new MediaRepositoryFake();
  const reloj = new RelojFijo('2026-11-24T18:00:00Z');
  const keys = new MediaKeyService();

  return {
    storage,
    repo,
    subirMedia: new SubirMediaUseCase(storage, repo, config, reloj, keys),
    subirArchivo: new SubirArchivoUseCase(storage, config, reloj, keys),
    eliminarMedia: new EliminarMediaUseCase(storage, repo),
  };
}

describe('almacenamiento-media: casos de uso', () => {
  it('subirMedia sube con el tipo real, registra la fila y devuelve la URL del CDN', async () => {
    const { storage, repo, subirMedia } = preparar();

    const r = await subirMedia.execute({
      empresaId: 1,
      clienteId: 7,
      subidoPorId: 3,
      publico: false,
      categoria: CategoriaMedia.CLIENTE_INSTALACION,
      tipo: TipoMedia.DOCUMENTO,
      buffer: JPEG,
      fileName: 'evidencia.bin',
      mime: 'application/octet-stream',
    });

    expect(storage.subidos).toHaveLength(1);
    expect(storage.subidos[0]).toMatchObject({
      bucket: 'bucket-crm',
      contentType: 'image/jpeg',
      acl: 'public-read',
    });
    expect(storage.subidos[0].key).toMatch(
      /^crm\/empresas\/1\/clientes\/7\/imagenes\/2026\/11\/24\/.+\.jpeg$/,
    );

    expect(r).toMatchObject({
      id: 1,
      bucket: 'bucket-crm',
      tipo: TipoMedia.IMAGEN,
    });
    expect(r.cdnUrl).toBe(`https://cdn.prueba/${r.key}`);

    expect(repo.filas.get(1)).toMatchObject({
      empresaId: 1,
      clienteId: 7,
      subidoPorId: 3,
      categoria: CategoriaMedia.CLIENTE_INSTALACION,
      estado: 'LISTO',
      mimeType: 'image/jpeg',
      extension: 'jpeg',
    });
  });

  it('subirMedia rechaza archivos vacíos sin tocar el almacenamiento', async () => {
    const { storage, subirMedia } = preparar();

    await expect(
      subirMedia.execute({
        empresaId: 1,
        publico: true,
        tipo: TipoMedia.IMAGEN,
        buffer: Buffer.alloc(0),
        fileName: 'x.jpg',
        mime: 'image/jpeg',
      }),
    ).rejects.toThrow(ArchivoVacioError);
    expect(storage.subidos).toHaveLength(0);
  });

  it('subirArchivo sube sin registrar fila en Media', async () => {
    const { storage, repo, subirArchivo } = preparar();

    const r = await subirArchivo.execute({
      buffer: JPEG,
      mime: 'image/jpeg',
      empresaId: 1,
      tipo: 'perfil-avatar',
      basePrefix: 'usuarios',
    });

    expect(r.key).toMatch(/^usuarios\/empresas\/1\/otros\/2026\/11\/24\//);
    expect(r).toMatchObject({
      provider: 'do-spaces',
      mimeType: 'image/jpeg',
      extension: 'jpeg',
    });
    expect(storage.subidos).toHaveLength(1);
    expect(repo.filas.size).toBe(0);
  });

  it('eliminarMedia borra el archivo y la fila; inexistente → MediaNoEncontradaError', async () => {
    const { storage, repo, subirMedia, eliminarMedia } = preparar();

    const subido = await subirMedia.execute({
      empresaId: 1,
      publico: true,
      tipo: TipoMedia.IMAGEN,
      buffer: JPEG,
      fileName: 'a.jpg',
      mime: 'image/jpeg',
    });

    await expect(
      eliminarMedia.execute({ id: subido.id, empresaId: 1 }),
    ).resolves.toEqual({
      id: subido.id,
      eliminado: true,
    });
    expect(storage.borrados).toEqual([
      { bucket: 'bucket-crm', key: subido.key },
    ]);
    expect(repo.filas.size).toBe(0);

    await expect(
      eliminarMedia.execute({ id: subido.id, empresaId: 1 }),
    ).rejects.toThrow(MediaNoEncontradaError);
  });
});
