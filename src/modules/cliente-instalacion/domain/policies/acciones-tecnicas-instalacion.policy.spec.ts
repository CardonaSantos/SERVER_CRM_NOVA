import { EstadoInstalacionCliente } from '../enums/estado-instalacion-cliente.enum';
import { calcularAccionesTecnicas } from './acciones-tecnicas-instalacion.policy';

const sinAccesos: never[] = [];

describe('calcularAccionesTecnicas', () => {
  it.each([
    EstadoInstalacionCliente.PROGRAMADA,
    EstadoInstalacionCliente.REPROGRAMADA,
  ])('%s: puede reprogramar, iniciar y cancelar; no completar', (estado) => {
    const a = calcularAccionesTecnicas(estado, sinAccesos);

    expect(a.reprogramar.habilitada).toBe(true);
    expect(a.iniciar.habilitada).toBe(true);
    expect(a.cancelar.habilitada).toBe(true);
    expect(a.completar).toEqual({
      habilitada: false,
      motivo: 'La instalación debe estar en proceso antes de completarse.',
    });
  });

  it('EN_PROCESO: puede completar y cancelar; no iniciar ni reprogramar', () => {
    const a = calcularAccionesTecnicas(
      EstadoInstalacionCliente.EN_PROCESO,
      sinAccesos,
    );

    expect(a.completar.habilitada).toBe(true);
    expect(a.cancelar.habilitada).toBe(true);
    expect(a.iniciar.habilitada).toBe(false);
    expect(a.reprogramar.habilitada).toBe(false);
  });

  it('CANCELADA: ni evidencias ni cancelar', () => {
    const a = calcularAccionesTecnicas(
      EstadoInstalacionCliente.CANCELADA,
      sinAccesos,
    );

    expect(a.subirEvidencia.habilitada).toBe(false);
    expect(a.cancelar.habilitada).toBe(false);
    expect(a.cancelar.motivo).toContain('ya no admite');
  });

  it('credenciales y reintento de prealta dependen de la cuenta PPPoE', () => {
    const conCuenta = calcularAccionesTecnicas(
      EstadoInstalacionCliente.EN_PROCESO,
      [{ metodoAutenticacion: 'PPPOE', cuentaPppoe: { id: 1 } }],
    );
    const sinCuenta = calcularAccionesTecnicas(
      EstadoInstalacionCliente.EN_PROCESO,
      [{ metodoAutenticacion: 'PPPOE', cuentaPppoe: null }],
    );
    const dhcp = calcularAccionesTecnicas(EstadoInstalacionCliente.EN_PROCESO, [
      { metodoAutenticacion: 'DHCP', cuentaPppoe: null },
    ]);

    expect(conCuenta.revelarCredenciales.habilitada).toBe(true);
    expect(conCuenta.reintentarPrealta.habilitada).toBe(false);
    expect(sinCuenta.reintentarPrealta.habilitada).toBe(true);
    expect(sinCuenta.revelarCredenciales.habilitada).toBe(false);
    expect(dhcp.reintentarPrealta.habilitada).toBe(false);
  });
});
