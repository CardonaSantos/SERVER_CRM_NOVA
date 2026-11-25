import { MikrotikPppoeCommandBuilder } from './mikrotik-pppoe-command.builder';
import { RouterOsValueEscaper } from './routeros-value-escaper';

describe('MikrotikPppoeCommandBuilder', () => {
  const builder = new MikrotikPppoeCommandBuilder(new RouterOsValueEscaper());

  it('crear secret: sintaxis auditada y versión sanitizada sin usuario ni contraseña', () => {
    const r = builder.construirCrearSecret({
      usuarioPppoe: '1234',
      passwordPppoe: 'NV-2026/11/24MH18:36#',
      codigoPerfil: 'PLAN_10M',
    });

    expect(r.comando).toBe(
      '/ppp secret add name="1234" password="NV-2026/11/24MH18:36#" profile="PLAN_10M" service="pppoe"',
    );
    expect(r.comandoSanitizado).toBe(
      '/ppp secret add name="<usuario>" password="<redacted>" profile="PLAN_10M" service="pppoe"',
    );
    expect(r.comandoSanitizado).not.toContain('NV-2026');
    expect(r.comandoSanitizado).not.toContain('1234');
    expect(Object.isFrozen(r)).toBe(true);
  });

  it('habilitar, deshabilitar y eliminar usan [find name="..."]', () => {
    const p = { usuarioPppoe: '1234' };

    expect(builder.construirHabilitarSecret(p).comando).toBe(
      '/ppp secret enable [find name="1234"]',
    );
    expect(builder.construirDeshabilitarSecret(p).comando).toBe(
      '/ppp secret disable [find name="1234"]',
    );
    expect(builder.construirEliminarSecret(p).comando).toBe(
      '/ppp secret remove [find name="1234"]',
    );
    expect(builder.construirEliminarSecret(p).comandoSanitizado).toBe(
      '/ppp secret remove [find name="<usuario>"]',
    );
  });

  it('un usuario malicioso no puede cerrar el find ni encadenar comandos', () => {
    const r = builder.construirEliminarSecret({
      usuarioPppoe: '1"] ; /system reset-configuration ; [find name="x',
    });

    expect(r.comando).toBe(
      '/ppp secret remove [find name="1\\"] ; /system reset-configuration ; [find name=\\"x"]',
    );
  });

  it('rechaza usuario con espacios externos o saltos de línea', () => {
    expect(() =>
      builder.construirHabilitarSecret({ usuarioPppoe: ' 1234' }),
    ).toThrow(/espacios/);
    expect(() =>
      builder.construirHabilitarSecret({ usuarioPppoe: '12\n/system reboot' }),
    ).toThrow(/control/);
  });
});
