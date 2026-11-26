import { TipoEvidenciaClienteOperacion } from '../enums/tipo-evidencia-cliente-operacion.enum';
import { ClienteInstalacionDatosInvalidosError } from '../errors/cliente-instalacion.errors';
import { ClienteInstalacionMediaEntity } from './cliente-instalacion-media.entity';

describe('ClienteInstalacionMediaEntity', () => {
  it('create: tipo OTRO, orden 0 y descripción recortada por omisión', () => {
    const e = ClienteInstalacionMediaEntity.create({
      instalacionId: 1,
      mediaId: 5,
      descripcion: '  foto  ',
    });

    expect(e.tipo).toBe(TipoEvidenciaClienteOperacion.OTRO);
    expect(e.orden).toBe(0);
    expect(e.descripcion).toBe('foto');
  });

  it('rechaza ids y orden inválidos', () => {
    expect(() =>
      ClienteInstalacionMediaEntity.create({ instalacionId: 0, mediaId: 5 }),
    ).toThrow(ClienteInstalacionDatosInvalidosError);
    expect(() =>
      ClienteInstalacionMediaEntity.create({
        instalacionId: 1,
        mediaId: 5,
        orden: -1,
      }),
    ).toThrow('orden');
  });

  it('cambiarOrden valida; cambiarDescripcion normaliza', () => {
    const e = ClienteInstalacionMediaEntity.create({
      instalacionId: 1,
      mediaId: 5,
    });

    e.cambiarOrden(3);
    e.cambiarDescripcion('   ');

    expect(e.orden).toBe(3);
    expect(e.descripcion).toBeNull();
    expect(() => e.cambiarOrden(1.5)).toThrow(
      ClienteInstalacionDatosInvalidosError,
    );
  });
});
