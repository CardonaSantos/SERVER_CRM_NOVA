import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import { PppoeCredentialGeneratorNovaAdapter } from './pppoe-credential-generator-nova.adapter';

describe('PppoeCredentialGeneratorNovaAdapter', () => {
  it('usuario = id del cliente; contraseña con el esquema NV- del instante del reloj', () => {
    const reloj = new RelojFijo('2026-11-24T18:36:00Z');
    const generador = new PppoeCredentialGeneratorNovaAdapter(reloj);

    const credenciales = generador.generate({ clienteId: 1234 });

    // 18:36 UTC = 12:36 en Guatemala (UTC-6), sin importar la zona del proceso.
    expect(credenciales.usuario).toBe('1234');
    expect(credenciales.secretoPlano).toBe('NV-2026/11/24MH12:36#');
    expect(credenciales.generadoEn.toISOString()).toBe(
      '2026-11-24T18:36:00.000Z',
    );
  });

  it('cerca de medianoche usa la fecha de Guatemala, no la de UTC', () => {
    // 03:10 UTC del 25 = 21:10 del 24 en Guatemala.
    const generador = new PppoeCredentialGeneratorNovaAdapter(
      new RelojFijo('2026-11-25T03:10:00Z'),
    );

    expect(generador.generate({ clienteId: 5 }).secretoPlano).toBe(
      'NV-2026/11/24MH21:10#',
    );
  });

  it('mantiene exactamente el formato de la convención', () => {
    const generador = new PppoeCredentialGeneratorNovaAdapter(new RelojFijo());
    const credenciales = generador.generate({ clienteId: 1 });

    expect(credenciales.secretoPlano).toMatch(
      /^NV-\d{4}\/\d{2}\/\d{2}MH\d{2}:\d{2}#$/,
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
