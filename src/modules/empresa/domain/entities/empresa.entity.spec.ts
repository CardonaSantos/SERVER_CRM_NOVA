import { empresaDePrueba } from '../../test/fakes/empresa.fake';
import { EmpresaDatosInvalidosError } from '../errors/empresa.errors';
import { EmpresaEntity } from './empresa.entity';

const AHORA = new Date('2026-07-01T12:00:00.000Z');

describe('EmpresaEntity', () => {
  it('solo cambia lo que llega', () => {
    const empresa = EmpresaEntity.hydrate(empresaDePrueba());

    empresa.actualizar({ nombre: '  Nueva  ', pbx: '1111' }, AHORA);

    expect(empresa.toPrimitives()).toEqual({
      ...empresaDePrueba(),
      nombre: 'Nueva',
      pbx: '1111',
      actualizadoEn: AHORA,
    });
  });

  it.each([null, '', '   '])('con %j quita un dato opcional', (valor) => {
    const empresa = EmpresaEntity.hydrate(empresaDePrueba());

    empresa.actualizar({ correo: valor }, AHORA);

    expect(empresa.toPrimitives().correo).toBeNull();
  });

  it.each([null, '  '])('no admite el nombre %j', (nombre) => {
    const empresa = EmpresaEntity.hydrate(empresaDePrueba());

    expect(() => empresa.actualizar({ nombre, pbx: '9' }, AHORA)).toThrow(
      EmpresaDatosInvalidosError,
    );
    expect(empresa.toPrimitives()).toEqual(empresaDePrueba());
  });
});
