import { TipoEvidenciaClienteOperacion } from 'src/modules/cliente-instalacion/public/cliente-instalacion.types';
import { ClienteDesinstalacionDatosInvalidosError } from '../errors/cliente-desinstalacion.errors';
import { ClienteDesinstalacionMediaEntity } from './cliente-desinstalacion-media.entity';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

describe('ClienteDesinstalacionMediaEntity', () => {
  it('create usa la fecha recibida, orden 0 y descripción recortada', () => {
    const e = ClienteDesinstalacionMediaEntity.create(
      {
        desinstalacionId: 1,
        mediaId: 5,
        tipo: TipoEvidenciaClienteOperacion.ANTES,
        descripcion: '  equipo  ',
      },
      AHORA,
    );

    expect(e).toMatchObject({
      orden: 0,
      descripcion: 'equipo',
      creadoEn: AHORA,
    });
    expect(e.id).toBeNull();
  });

  it('rechaza ids y orden inválidos', () => {
    const base = {
      desinstalacionId: 1,
      mediaId: 5,
      tipo: TipoEvidenciaClienteOperacion.ANTES,
    };

    expect(() =>
      ClienteDesinstalacionMediaEntity.create(
        { ...base, desinstalacionId: 0 },
        AHORA,
      ),
    ).toThrow(ClienteDesinstalacionDatosInvalidosError);
    expect(() =>
      ClienteDesinstalacionMediaEntity.create({ ...base, orden: -1 }, AHORA),
    ).toThrow('orden');
  });
});
