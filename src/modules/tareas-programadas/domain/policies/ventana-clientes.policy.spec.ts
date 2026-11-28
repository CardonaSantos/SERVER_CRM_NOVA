import {
  dentroDeVentanaClientes,
  horaGuatemala,
} from './ventana-clientes.policy';

// Guatemala es UTC-6 todo el año: las 10:00 de Guatemala son las 16:00 UTC.
const gt = (hora: string, fecha = '2027-03-06') => {
  const [h, m] = hora.split(':').map(Number);
  const utc = new Date(`${fecha}T00:00:00.000Z`);
  utc.setUTCHours(h + 6, m, 0, 0);
  return utc;
};

describe('ventana de clientes', () => {
  it('abre a las 10:00 y cierra a las 18:00 de Guatemala', () => {
    expect(dentroDeVentanaClientes(gt('09:59'))).toBe(false);
    expect(dentroDeVentanaClientes(gt('10:00'))).toBe(true);
    expect(dentroDeVentanaClientes(gt('17:30'))).toBe(true);
    expect(dentroDeVentanaClientes(gt('17:59'))).toBe(true);
    expect(dentroDeVentanaClientes(gt('18:00'))).toBe(false);
  });

  it('de noche está cerrada aunque en UTC ya sea otro día', () => {
    // 23:30 de Guatemala = 05:30 UTC del día siguiente.
    expect(dentroDeVentanaClientes(gt('23:30'))).toBe(false);
    expect(dentroDeVentanaClientes(gt('00:30'))).toBe(false);
  });

  it('lee la hora en Guatemala, no en UTC', () => {
    expect(horaGuatemala(new Date('2027-03-06T16:45:00.000Z'))).toEqual({
      hora: 10,
      minuto: 45,
    });
    expect(horaGuatemala(new Date('2027-03-07T05:59:00.000Z'))).toEqual({
      hora: 23,
      minuto: 59,
    });
  });
});
