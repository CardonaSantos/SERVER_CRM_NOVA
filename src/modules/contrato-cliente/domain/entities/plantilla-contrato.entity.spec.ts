import { ContratoDatosInvalidosError } from '../errors/contrato-cliente.errors';
import { PlantillaContratoEntity } from './plantilla-contrato.entity';

const AHORA = new Date('2026-11-27T18:00:00.000Z');
const DESPUES = new Date('2026-11-28T18:00:00.000Z');

const crear = () =>
  PlantillaContratoEntity.create(
    { nombre: ' Hogar ', body: 'Texto\n  con sangría\n', empresaId: 1 },
    AHORA,
  );

describe('PlantillaContratoEntity', () => {
  it('recorta el nombre y respeta el texto', () => {
    expect(crear().toPrimitives()).toMatchObject({
      nombre: 'Hogar',
      body: 'Texto\n  con sangría\n',
    });
  });

  it('solo cambia lo que llega', () => {
    const plantilla = crear();

    plantilla.actualizar({ nombre: 'Empresa' }, DESPUES);

    expect(plantilla.toPrimitives()).toMatchObject({
      nombre: 'Empresa',
      body: 'Texto\n  con sangría\n',
      creadoEn: AHORA,
      actualizadoEn: DESPUES,
    });
  });

  it.each([{ nombre: ' ' }, { body: '\n ' }])(
    'no admite vaciar %o',
    (cambios) => {
      expect(() => crear().actualizar(cambios, DESPUES)).toThrow(
        ContratoDatosInvalidosError,
      );
    },
  );
});
