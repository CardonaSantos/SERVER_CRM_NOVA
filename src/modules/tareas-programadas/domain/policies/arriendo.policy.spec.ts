import {
  DURACION_ARRIENDO_MS,
  ESPERA_REINTENTO_MS,
  INTERVALO_RENOVACION_MS,
  siguienteReintento,
  vencimientoArriendo,
} from './arriendo.policy';

const AHORA = new Date('2027-03-06T16:00:00.000Z');

describe('arriendo.policy', () => {
  it('el arriendo dura 10 minutos y se renueva cada minuto', () => {
    expect(vencimientoArriendo(AHORA).getTime() - AHORA.getTime()).toBe(
      DURACION_ARRIENDO_MS,
    );
    expect(DURACION_ARRIENDO_MS).toBeGreaterThan(INTERVALO_RENOVACION_MS * 5);
  });

  it('el reintento llega antes del siguiente repaso de 30 minutos', () => {
    expect(siguienteReintento(AHORA).getTime() - AHORA.getTime()).toBe(
      ESPERA_REINTENTO_MS,
    );
    expect(ESPERA_REINTENTO_MS).toBeLessThan(30 * 60_000);
  });
});
