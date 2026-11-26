import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { AlmacenamientoMediaFacadePort } from 'src/modules/almacenamiento-media/public/almacenamiento-media.facade.port';
import {
  CategoriaMedia,
  TipoMedia,
} from 'src/modules/almacenamiento-media/public/almacenamiento-media.types';
import { TipoEvidenciaClienteOperacion } from 'src/modules/cliente-instalacion/public/cliente-instalacion.types';
import {
  ClienteDesinstalacionNoEncontradaError,
  EvidenciaDesinstalacionRequeridaError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import { AlmacenamientoMediaFake } from '../../test/fakes/almacenamiento-media.fake';
import { ClienteDesinstalacionMediaRepositoryFake } from '../../test/fakes/cliente-desinstalacion-media-repository.fake';
import { ClienteDesinstalacionRepositoryFake } from '../../test/fakes/cliente-desinstalacion-repository.fake';
import { SubirEvidenciaDesinstalacionUseCase } from './subir-evidencia-desinstalacion.use-case';

const archivo = (mimetype = 'image/jpeg', buffer = Buffer.from('x')) => ({
  buffer,
  mimetype,
  originalname: 'foto.jpg',
});

describe('SubirEvidenciaDesinstalacionUseCase', () => {
  let desinstalaciones: ClienteDesinstalacionRepositoryFake;
  let evidencias: ClienteDesinstalacionMediaRepositoryFake;
  let almacenamiento: AlmacenamientoMediaFake;
  let useCase: SubirEvidenciaDesinstalacionUseCase;

  beforeEach(() => {
    desinstalaciones = new ClienteDesinstalacionRepositoryFake();
    evidencias = new ClienteDesinstalacionMediaRepositoryFake();
    almacenamiento = new AlmacenamientoMediaFake();
    useCase = new SubirEvidenciaDesinstalacionUseCase(
      desinstalaciones,
      evidencias,
      almacenamiento as unknown as AlmacenamientoMediaFacadePort,
      new RelojFijo('2026-11-25T15:00:00Z'),
    );
    desinstalaciones.sembrar();
  });

  const input = (extra = {}) => ({
    desinstalacionId: 100,
    subidoPorId: 3,
    file: archivo(),
    tipo: TipoEvidenciaClienteOperacion.ANTES,
    ...extra,
  });

  it('sube el archivo con la empresa y el cliente de la desinstalación y guarda la evidencia', async () => {
    const r = await useCase.execute(input({ descripcion: 'router', orden: 2 }));

    expect(almacenamiento.subidas[0]).toMatchObject({
      empresaId: 1,
      clienteId: 7,
      subidoPorId: 3,
      categoria: CategoriaMedia.CLIENTE_DESINSTALACION,
      tipo: TipoMedia.IMAGEN,
    });
    expect(r.evidencia).toMatchObject({
      desinstalacionId: 100,
      mediaId: 41,
      tipo: TipoEvidenciaClienteOperacion.ANTES,
      orden: 2,
      creadoEn: new Date('2026-11-25T15:00:00Z'),
    });
    expect(r.media).toMatchObject({ id: 41, cdnUrl: null });
  });

  it('sin tipo queda como OTRO', async () => {
    const r = await useCase.execute(input({ tipo: undefined }));

    expect(r.evidencia.tipo).toBe(TipoEvidenciaClienteOperacion.OTRO);
  });

  it.each([
    ['video/mp4', TipoMedia.VIDEO],
    ['audio/mpeg', TipoMedia.AUDIO],
    ['application/pdf', TipoMedia.DOCUMENTO],
    ['text/plain', TipoMedia.OTRO],
  ])('el tipo de media sale del mime %s', async (mime, esperado) => {
    await useCase.execute(input({ file: archivo(mime) }));

    expect(almacenamiento.subidas[0].tipo).toBe(esperado);
  });

  it('un archivo ausente o vacío no sube nada', async () => {
    await expect(useCase.execute(input({ file: undefined }))).rejects.toThrow(
      EvidenciaDesinstalacionRequeridaError,
    );
    await expect(
      useCase.execute(input({ file: archivo('image/png', Buffer.alloc(0)) })),
    ).rejects.toThrow(EvidenciaDesinstalacionRequeridaError);
    expect(almacenamiento.subidas).toHaveLength(0);
  });

  it('desinstalación inexistente: no se sube el archivo', async () => {
    await expect(
      useCase.execute(input({ desinstalacionId: 999 })),
    ).rejects.toThrow(ClienteDesinstalacionNoEncontradaError);
    expect(almacenamiento.subidas).toHaveLength(0);
  });
});
