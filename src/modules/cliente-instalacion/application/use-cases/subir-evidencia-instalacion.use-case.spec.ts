import { AlmacenamientoMediaFacadePort } from 'src/modules/almacenamiento-media/public/almacenamiento-media.facade.port';
import {
  CategoriaMedia,
  TipoMedia,
} from 'src/modules/almacenamiento-media/public/almacenamiento-media.types';
import { TipoEvidenciaClienteOperacion } from '../../domain/enums/tipo-evidencia-cliente-operacion.enum';
import {
  ClienteInstalacionNoEncontradaError,
  EvidenciaInstalacionRequeridaError,
} from '../../domain/errors/cliente-instalacion.errors';
import { AlmacenamientoMediaFake } from '../../test/fakes/almacenamiento-media.fake';
import { ClienteInstalacionMediaRepositoryFake } from '../../test/fakes/cliente-instalacion-media-repository.fake';
import { ClienteInstalacionRepositoryFake } from '../../test/fakes/cliente-instalacion-repository.fake';
import { SubirEvidenciaInstalacionUseCase } from './subir-evidencia-instalacion.use-case';

const archivo = (mimetype = 'image/jpeg') => ({
  buffer: Buffer.from('x'),
  mimetype,
  originalname: 'foto.jpg',
});

describe('SubirEvidenciaInstalacionUseCase', () => {
  let instalaciones: ClienteInstalacionRepositoryFake;
  let evidencias: ClienteInstalacionMediaRepositoryFake;
  let almacenamiento: AlmacenamientoMediaFake;
  let useCase: SubirEvidenciaInstalacionUseCase;

  beforeEach(() => {
    instalaciones = new ClienteInstalacionRepositoryFake();
    evidencias = new ClienteInstalacionMediaRepositoryFake();
    almacenamiento = new AlmacenamientoMediaFake();
    useCase = new SubirEvidenciaInstalacionUseCase(
      instalaciones,
      evidencias,
      almacenamiento as unknown as AlmacenamientoMediaFacadePort,
    );
    instalaciones.sembrar();
  });

  const input = (extra = {}) => ({
    instalacionId: 100,
    empresaId: 1,
    subidoPorId: 3,
    file: archivo(),
    tipo: TipoEvidenciaClienteOperacion.ANTES,
    ...extra,
  });

  it('sube el archivo con la empresa y el usuario recibidos y guarda la evidencia', async () => {
    const r = await useCase.execute(
      input({ descripcion: 'fachada', orden: 2 }),
    );

    expect(almacenamiento.subidas[0]).toMatchObject({
      empresaId: 1,
      clienteId: 7,
      subidoPorId: 3,
      categoria: CategoriaMedia.CLIENTE_GENERAL,
      tipo: TipoMedia.IMAGEN,
      mime: 'image/jpeg',
    });
    expect(r).toMatchObject({
      instalacionId: 100,
      mediaId: 41,
      tipo: TipoEvidenciaClienteOperacion.ANTES,
      descripcion: 'fachada',
      orden: 2,
    });
  });

  it.each([
    ['video/mp4', TipoMedia.VIDEO],
    ['audio/mpeg', TipoMedia.AUDIO],
    ['application/pdf', TipoMedia.DOCUMENTO],
    ['application/zip', TipoMedia.OTRO],
  ])('el tipo de media sale del mime %s', async (mime, esperado) => {
    await useCase.execute(input({ file: archivo(mime) }));

    expect(almacenamiento.subidas[0].tipo).toBe(esperado);
  });

  it('sin archivo no sube nada', async () => {
    await expect(useCase.execute(input({ file: undefined }))).rejects.toThrow(
      EvidenciaInstalacionRequeridaError,
    );
    expect(almacenamiento.subidas).toHaveLength(0);
  });

  it('si la instalación no existe, no se sube el archivo', async () => {
    await expect(
      useCase.execute(input({ instalacionId: 999 })),
    ).rejects.toThrow(ClienteInstalacionNoEncontradaError);
    expect(almacenamiento.subidas).toHaveLength(0);
    expect(evidencias.guardadas).toHaveLength(0);
  });
});
