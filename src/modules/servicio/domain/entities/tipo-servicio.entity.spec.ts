import { EstadoServicio } from '../enums/estado-servicio.enum';
import { TipoServicioInvalidoError } from '../errors/servicio.errors';
import { TipoServicioEntity } from './tipo-servicio.entity';

const AHORA = new Date('2026-11-26T18:00:00.000Z');

describe('TipoServicioEntity', () => {
  it('nace activo con el texto recortado', () => {
    expect(
      TipoServicioEntity.create(
        { nombre: ' Equipo ', descripcion: ' Alquiler ' },
        AHORA,
      ).toPrimitives(),
    ).toMatchObject({
      nombre: 'Equipo',
      descripcion: 'Alquiler',
      estado: EstadoServicio.ACTIVO,
    });
  });

  it('exige nombre', () => {
    expect(() => TipoServicioEntity.create({ nombre: ' ' }, AHORA)).toThrow(
      TipoServicioInvalidoError,
    );
  });
});
