import { EstadoRutaCobro } from '../enums/estado-ruta-cobro.enum';
import {
  RutaCobroCerradaError,
  RutaCobroClienteAjenoError,
  RutaCobroEliminadaError,
  RutaCobroInvalidaError,
} from '../errors/ruta-cobro.errors';
import { RutaCobroEntity } from './ruta-cobro.entity';

const AHORA = new Date('2026-11-26T18:00:00.000Z');
const DESPUES = new Date('2026-11-27T18:00:00.000Z');

const alta = { empresaId: 1, nombre: '  Ruta norte  ', clienteIds: [7, 8, 7] };
const nueva = () => RutaCobroEntity.create(alta, AHORA);

describe('RutaCobroEntity', () => {
  it('nace asignada, sin repetir clientes y con los textos recortados', () => {
    expect(nueva().toPrimitives()).toMatchObject({
      nombre: 'Ruta norte',
      estado: EstadoRutaCobro.ASIGNADA,
      clienteIds: [7, 8],
      cobradorId: null,
      observaciones: null,
      creadoEn: AHORA,
    });
  });

  it.each([
    { nombre: '   ' },
    { nombre: 'x'.repeat(201) },
    { observaciones: 'x'.repeat(2001) },
    { clienteIds: [] },
    { clienteIds: [0] },
  ])('no se crea con %p', (cambio) => {
    expect(() => RutaCobroEntity.create({ ...alta, ...cambio }, AHORA)).toThrow(
      RutaCobroInvalidaError,
    );
  });

  it('editar solo cambia lo que llega', () => {
    const ruta = RutaCobroEntity.create(
      { ...alta, cobradorId: 4, observaciones: 'nota' },
      AHORA,
    );

    ruta.editar({ nombre: 'Otra', cobradorId: undefined }, DESPUES);

    expect(ruta.toPrimitives()).toMatchObject({
      nombre: 'Otra',
      cobradorId: 4,
      observaciones: 'nota',
      clienteIds: [7, 8],
      actualizadoEn: DESPUES,
    });
  });

  it('null quita el cobrador y las observaciones', () => {
    const ruta = RutaCobroEntity.create(
      { ...alta, cobradorId: 4, observaciones: 'nota' },
      AHORA,
    );

    ruta.editar({ cobradorId: null, observaciones: null }, DESPUES);

    expect(ruta.toPrimitives()).toMatchObject({
      cobradorId: null,
      observaciones: null,
    });
  });

  it('se cierra una vez y puede reabrirse al editar', () => {
    const ruta = nueva();
    ruta.cerrar(DESPUES);

    expect(ruta.toPrimitives().estado).toBe(EstadoRutaCobro.CERRADO);
    expect(() => ruta.cerrar(DESPUES)).toThrow(RutaCobroCerradaError);

    ruta.editar({ estado: EstadoRutaCobro.EN_CURSO }, DESPUES);
    expect(() => ruta.asegurarCobrable(7)).not.toThrow();
  });

  it.each([EstadoRutaCobro.CERRADO, EstadoRutaCobro.CANCELADO])(
    'en estado %s no se cobra',
    (estado) => {
      const ruta = nueva();
      ruta.editar({ estado }, DESPUES);

      expect(() => ruta.asegurarCobrable(7)).toThrow(RutaCobroCerradaError);
    },
  );

  it('solo cobra a sus clientes', () => {
    expect(() => nueva().asegurarCobrable(99)).toThrow(
      RutaCobroClienteAjenoError,
    );
  });

  it('eliminada ya no se modifica', () => {
    const ruta = nueva();
    ruta.eliminar(5, DESPUES);

    expect(ruta.toPrimitives()).toMatchObject({
      eliminadoEn: DESPUES,
      eliminadoPorId: 5,
    });
    expect(() => ruta.editar({ nombre: 'x' }, DESPUES)).toThrow(
      RutaCobroEliminadaError,
    );
    expect(() => ruta.cerrar(DESPUES)).toThrow(RutaCobroEliminadaError);
    expect(() => ruta.eliminar(5, DESPUES)).toThrow(RutaCobroEliminadaError);
  });

  it('una ruta anterior sin clientes se puede leer', () => {
    expect(() =>
      RutaCobroEntity.hydrate({
        ...nueva().toPrimitives(),
        id: 3,
        clienteIds: [],
      }),
    ).not.toThrow();
  });
});
