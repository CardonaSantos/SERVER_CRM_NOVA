import { PppoeOperacionStepError } from '../../domain/errors/pppoe-automatizacion.errors';
import { PppoeOperacionFacadeFake } from '../../test/fakes/pppoe-operacion-facade.fake';
import { PppoeOperacionStepRunnerService } from './pppoe-operacion-step-runner.service';

const base = { empresaId: 1, operacionId: 10, orden: 2 };

describe('PppoeOperacionStepRunnerService', () => {
  let operaciones: PppoeOperacionFacadeFake;
  let runner: PppoeOperacionStepRunnerService;

  beforeEach(() => {
    operaciones = new PppoeOperacionFacadeFake();
    runner = new PppoeOperacionStepRunnerService(operaciones);
  });

  it('persiste INICIAR antes de la acción y MARCAR_EXITOSO después', async () => {
    const vistoAlEjecutar: string[] = [];

    const valor = await runner.ejecutar({
      ...base,
      comandoSanitizado: '/ppp secret print',
      ejecutar: () => {
        vistoAlEjecutar.push(...operaciones.acciones);
        return Promise.resolve({ value: 42, respuestaSanitizada: 'ok' });
      },
    });

    expect(valor).toBe(42);
    expect(vistoAlEjecutar).toEqual(['INICIAR']);
    expect(operaciones.acciones).toEqual(['INICIAR', 'MARCAR_EXITOSO']);
    expect(operaciones.pasos[0]).toMatchObject({
      operacionId: 10,
      selector: { orden: 2 },
      comandoSanitizado: '/ppp secret print',
    });
    expect(operaciones.pasos[1]).toMatchObject({ respuestaSanitizada: 'ok' });
  });

  it('no toca el router si no pudo persistir el inicio', async () => {
    operaciones.fallarAl.add('INICIAR');
    const ejecutar = jest.fn();

    await expect(runner.ejecutar({ ...base, ejecutar })).rejects.toThrow();
    expect(ejecutar).not.toHaveBeenCalled();
  });

  it('marca el paso FALLIDO y propaga un error normalizado y seguro', async () => {
    const error = await runner
      .ejecutar({
        ...base,
        ejecutar: () => Promise.reject(new Error('stdout con password=x')),
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PppoeOperacionStepError);
    const fallo = error as PppoeOperacionStepError;
    expect(fallo.errorCodigo).toBe('ERROR_PASO_DESCONOCIDO');
    expect(fallo.message).not.toContain('password');
    // Un error desconocido pudo haber cambiado el router: no se repite a ciegas.
    expect(fallo.pudoModificarRouter()).toBe(true);
    expect(operaciones.acciones).toEqual(['INICIAR', 'MARCAR_FALLIDO']);
    expect(operaciones.pasos[1]).toMatchObject({
      errorCodigo: 'ERROR_PASO_DESCONOCIDO',
      respuestaSanitizada: null,
    });
  });

  it('si tampoco puede guardar el fallo, propaga el error técnico original', async () => {
    operaciones.fallarAl.add('MARCAR_FALLIDO');

    const error = await runner
      .ejecutar({ ...base, ejecutar: () => Promise.reject(new Error('ssh')) })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PppoeOperacionStepError);
    expect(operaciones.acciones).toEqual(['INICIAR']);
  });

  it('omitir marca el paso OMITIDO con su motivo', async () => {
    await runner.omitir({ ...base, motivo: 'El secret ya existe.' });

    expect(operaciones.pasos).toEqual([
      expect.objectContaining({
        accion: 'OMITIR',
        selector: { orden: 2 },
        motivo: 'El secret ya existe.',
      }),
    ]);
  });

  it('rechaza un orden inválido sin persistir nada', async () => {
    await expect(
      runner.ejecutar({
        ...base,
        orden: 0,
        ejecutar: () => Promise.resolve({ value: 1 }),
      }),
    ).rejects.toThrow('orden');
    expect(operaciones.pasos).toHaveLength(0);
  });
});
