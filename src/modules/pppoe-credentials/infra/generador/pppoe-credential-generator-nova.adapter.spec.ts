import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { dayjs } from 'src/Utils/dayjs.config';

import { PppoeCredentialGeneratorNovaAdapter } from './pppoe-credential-generator-nova.adapter';

describe('PppoeCredentialGeneratorNovaAdapter', () => {
  it('usuario = id del cliente; contraseña con el esquema NV- del instante del reloj', () => {
    const reloj = new RelojFijo('2026-11-24T18:36:00Z');
    const generador = new PppoeCredentialGeneratorNovaAdapter(reloj);

    const credenciales = generador.generate({ clienteId: 1234 });

    // Mismo formato que antes: dayjs(fecha) en la zona del proceso.
    const esperado = `NV-${dayjs(reloj.ahora()).format('YYYY/MM/DD[MH]HH:mm[#]')}`;

    expect(credenciales.usuario).toBe('1234');
    expect(credenciales.secretoPlano).toBe(esperado);
    expect(credenciales.secretoPlano).toMatch(
      /^NV-\d{4}\/\d{2}\/\d{2}MH\d{2}:\d{2}#$/,
    );
    expect(credenciales.generadoEn.toISOString()).toBe(
      '2026-11-24T18:36:00.000Z',
    );
  });

  it('la fecha del input tiene prioridad sobre el reloj', () => {
    const generador = new PppoeCredentialGeneratorNovaAdapter(
      new RelojFijo('2030-01-01T00:00:00Z'),
    );

    const credenciales = generador.generate({
      clienteId: 7,
      fecha: new Date('2026-01-15T10:05:00Z'),
    });

    expect(credenciales.generadoEn.toISOString()).toBe(
      '2026-01-15T10:05:00.000Z',
    );
  });

  it('rechaza ids inválidos y fechas inválidas', () => {
    const generador = new PppoeCredentialGeneratorNovaAdapter(new RelojFijo());

    expect(() => generador.generate({ clienteId: 0 })).toThrow(
      /entero positivo/,
    );
    expect(() => generador.generate({ clienteId: 1.5 })).toThrow(
      /entero positivo/,
    );
    expect(() =>
      generador.generate({ clienteId: 1, fecha: new Date('no-es-fecha') }),
    ).toThrow(/no es válida/);
  });
});
