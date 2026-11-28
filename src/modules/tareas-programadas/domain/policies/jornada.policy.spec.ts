import { FaseJornada } from '../enums/jornada.enum';
import { EtapaJornadaInvalidaError } from '../errors/tareas-programadas.errors';
import {
  claveJornada,
  ordenarEtapas,
  validarEtapaNueva,
} from './jornada.policy';

describe('jornada', () => {
  it('la clave es una por día', () => {
    expect(claveJornada('2027-03-06')).toBe('JORNADA:2027-03-06');
  });

  it('ordena por fase, luego por orden y luego por nombre', () => {
    const etapas = [
      {
        tarea: 'DESPACHAR_COBRANZA',
        fase: FaseJornada.ENVIO_COBRANZA,
        orden: 0,
      },
      { tarea: 'EVALUAR_MORA', fase: FaseJornada.COBRANZA, orden: 10 },
      {
        tarea: 'ENVIAR_RECORDATORIO_1',
        fase: FaseJornada.FACTURACION,
        orden: 30,
      },
      { tarea: 'DESPACHAR', fase: FaseJornada.ENVIO_FACTURACION, orden: 0 },
      { tarea: 'GENERAR_FACTURAS', fase: FaseJornada.FACTURACION, orden: 10 },
      { tarea: 'B', fase: FaseJornada.COBRANZA, orden: 20 },
      { tarea: 'A', fase: FaseJornada.COBRANZA, orden: 20 },
    ];

    expect(ordenarEtapas(etapas).map((e) => e.tarea)).toEqual([
      'GENERAR_FACTURAS',
      'ENVIAR_RECORDATORIO_1',
      'DESPACHAR',
      'EVALUAR_MORA',
      'A',
      'B',
      'DESPACHAR_COBRANZA',
    ]);
  });

  it('no modifica la lista que recibe', () => {
    const etapas = [
      { tarea: 'B', fase: FaseJornada.COBRANZA, orden: 1 },
      { tarea: 'A', fase: FaseJornada.FACTURACION, orden: 1 },
    ];
    ordenarEtapas(etapas);
    expect(etapas[0].tarea).toBe('B');
  });

  describe('validarEtapaNueva', () => {
    const valida = {
      tarea: 'GENERAR_FACTURAS',
      fase: FaseJornada.FACTURACION,
      orden: 10,
    };

    it('acepta una etapa nueva', () => {
      expect(() => validarEtapaNueva(valida, [])).not.toThrow();
    });

    it('la misma tarea puede estar en otra fase, no dos veces en la misma', () => {
      expect(() =>
        validarEtapaNueva({ ...valida, fase: FaseJornada.COBRANZA }, [valida]),
      ).not.toThrow();
      expect(() =>
        validarEtapaNueva({ ...valida, orden: 99 }, [valida]),
      ).toThrow(EtapaJornadaInvalidaError);
    });

    it.each([
      { ...valida, tarea: 'generar facturas' },
      { ...valida, fase: 'OTRA' as FaseJornada },
      { ...valida, orden: -1 },
      { ...valida, orden: 1.5 },
    ])('rechaza %o', (etapa) => {
      expect(() => validarEtapaNueva(etapa, [])).toThrow(
        EtapaJornadaInvalidaError,
      );
    });
  });
});
