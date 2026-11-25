import { CodigoErrorMikrotikSsh } from '../../domain/enums/mikrotik-ssh.enums';
import { MikrotikSshError } from '../../domain/errors/mikrotik-ssh.error';

import { RouterOsValueEscaper } from './routeros-value-escaper';

describe('RouterOsValueEscaper', () => {
  const escaper = new RouterOsValueEscaper();
  const opciones = { campo: 'usuarioPppoe', maxBytes: 64 };

  it('envuelve en comillas y escapa \\, " y $', () => {
    expect(escaper.escaparCadena('1234', opciones)).toBe('"1234"');
    expect(escaper.escaparCadena('a"b', opciones)).toBe('"a\\"b"');
    expect(escaper.escaparCadena('a\\b', opciones)).toBe('"a\\\\b"');
    expect(escaper.escaparCadena('$var', opciones)).toBe('"\\$var"');
  });

  it('un intento de inyección queda dentro de la cadena', () => {
    const malicioso = '1"] ; /system reboot ; [find name="x';

    const escapado = escaper.escaparCadena(malicioso, opciones);

    // Toda comilla interna queda escapada: la cadena no se puede cerrar.
    const interior = escapado.slice(1, -1);
    expect(interior.replace(/\\"/g, '')).not.toContain('"');
    expect(escapado.startsWith('"') && escapado.endsWith('"')).toBe(true);
  });

  it('rechaza caracteres de control y saltos de línea (otro comando)', () => {
    for (const valor of ['a\nb', 'a\rb', 'a\u0000b', 'a b', 'a\tb']) {
      expect(() => escaper.escaparCadena(valor, opciones)).toThrow(
        MikrotikSshError,
      );
    }
  });

  it('rechaza vacío, espacios externos (si se pide) y exceso de bytes', () => {
    const error = (fn: () => unknown) => {
      try {
        fn();
      } catch (e) {
        return e as MikrotikSshError;
      }
      throw new Error('no lanzó');
    };

    expect(error(() => escaper.escaparCadena('', opciones)).codigo).toBe(
      CodigoErrorMikrotikSsh.CONFIGURACION_INVALIDA,
    );
    expect(
      escaper.escaparCadena('', { ...opciones, permitirVacio: true }),
    ).toBe('""');
    expect(() =>
      escaper.escaparCadena(' x', {
        ...opciones,
        rechazarEspaciosExternos: true,
      }),
    ).toThrow(/espacios/);
    expect(escaper.escaparCadena(' x', opciones)).toBe('" x"');
    // 'ñ' ocupa 2 bytes en UTF-8.
    expect(() =>
      escaper.escaparCadena('ñ'.repeat(33), { ...opciones, maxBytes: 64 }),
    ).toThrow(/64 bytes/);
  });

  it('rechaza Unicode inválido (surrogate suelto)', () => {
    expect(() => escaper.escaparCadena('a\uD800b', opciones)).toThrow(
      /Unicode/,
    );
  });
});
