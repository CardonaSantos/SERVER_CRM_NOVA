import { DomainError } from 'src/common/hexagonal/domain-error';
import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import {
  EstadoEjecucionTarea,
  OrigenEjecucionTarea,
} from '../../domain/enums/ejecucion-tarea.enum';
import { MAXIMO_ERRORES_DETALLE } from '../../domain/policies/arriendo.policy';
import {
  ContextoTareaProgramada,
  EjecutarTareaInput,
} from '../../public/tareas-programadas.facade.port';
import { EjecucionTareaRepositoryFake } from '../../test/fakes/ejecucion-tarea-repository.fake';
import { TemporizadorFake } from '../../test/fakes/temporizador.fake';
import { EjecutarTareaProgramadaUseCase } from './ejecutar-tarea-programada.use-case';

const CLAVE = 'LIMPIEZA:2027-03-06';

class SinPlantillaError extends DomainError {
  readonly codigo = 'PRUEBA_SIN_PLANTILLA';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('Falta la plantilla.');
  }
}

function preparar(activas = true) {
  const reloj = new RelojFijo('2027-03-06T16:00:00.000Z');
  const repo = new EjecucionTareaRepositoryFake();
  const temporizador = new TemporizadorFake();
  const useCase = new EjecutarTareaProgramadaUseCase(
    repo,
    { activas },
    temporizador,
    reloj,
  );
  return { reloj, repo, temporizador, useCase };
}

function entrada(
  trabajo: EjecutarTareaInput['trabajo'] = async () => {},
  extra: Partial<EjecutarTareaInput> = {},
): EjecutarTareaInput {
  return {
    clave: CLAVE,
    tarea: 'LIMPIEZA',
    fechaOperativa: '2027-03-06',
    trabajo,
    ...extra,
  };
}

describe('EjecutarTareaProgramadaUseCase', () => {
  it('con el interruptor apagado no toca el registro ni el trabajo', async () => {
    const { repo, useCase } = preparar(false);
    const trabajo = jest.fn();

    const r = await useCase.execute(entrada(trabajo));

    expect(r).toEqual({
      resultado: 'OMITIDA',
      motivo: 'APAGADO',
      ejecucionId: null,
    });
    expect(trabajo).not.toHaveBeenCalled();
    expect(repo.filas.size).toBe(0);
  });

  it('ejecuta una vez y guarda conteos, datos y errores por elemento', async () => {
    const { repo, useCase } = preparar();

    const r = await useCase.execute(
      entrada(async (ctx) => {
        ctx.contarProcesados(3);
        ctx.contarProcesados();
        ctx.registrarError('cliente-12', 'SIN_PLAN');
        ctx.anotar('facturasCreadas', 3);
      }),
    );

    expect(r).toMatchObject({
      resultado: 'EJECUTADA',
      estado: EstadoEjecucionTarea.COMPLETADA_CON_ERRORES,
    });
    expect(repo.fila(CLAVE)).toMatchObject({
      estado: EstadoEjecucionTarea.COMPLETADA_CON_ERRORES,
      procesados: 4,
      errores: 1,
      bloqueadoHasta: null,
      resumen: {
        datos: { facturasCreadas: 3 },
        erroresDetalle: [{ referencia: 'cliente-12', codigo: 'SIN_PLAN' }],
        erroresOmitidos: 0,
      },
    });
  });

  it('la segunda llamada con la misma clave no repite el trabajo', async () => {
    const { useCase } = preparar();
    const trabajo = jest.fn(async () => {});

    await useCase.execute(entrada(trabajo));
    const r = await useCase.execute(entrada(trabajo));

    expect(trabajo).toHaveBeenCalledTimes(1);
    expect(r).toMatchObject({ resultado: 'OMITIDA', motivo: 'COMPLETADA' });
  });

  it('no entra mientras otra ejecución tiene el arriendo vigente', async () => {
    const { repo, reloj, useCase } = preparar();
    let segunda: unknown;

    await useCase.execute(
      entrada(async () => {
        reloj.avanzar({ minutos: 5 });
        segunda = await useCase.execute(entrada(async () => {}));
      }),
    );

    expect(segunda).toMatchObject({ resultado: 'OMITIDA', motivo: 'EN_CURSO' });
    expect(repo.fila(CLAVE).estado).toBe(EstadoEjecucionTarea.COMPLETADA);
  });

  it('si otra instancia inserta la clave primero, no la duplica', async () => {
    const { repo, useCase, reloj } = preparar();
    const trabajo = jest.fn(async () => {});
    repo.antesDeCrear = () =>
      void repo.filas.set(CLAVE, {
        id: 99,
        clave: CLAVE,
        tarea: 'LIMPIEZA',
        facturacionZonaId: null,
        fechaOperativa: '2027-03-06',
        origen: OrigenEjecucionTarea.PROGRAMADA,
        ejecutadaPorId: null,
        estado: EstadoEjecucionTarea.EJECUTANDO,
        intentos: 1,
        bloqueadoHasta: new Date(reloj.ahora().getTime() + 600_000),
        siguienteIntentoEn: null,
        iniciadaEn: reloj.ahora(),
        finalizadaEn: null,
        procesados: 0,
        errores: 0,
        resumen: null,
        errorCodigo: null,
        errorMensaje: null,
      });

    const r = await useCase.execute(entrada(trabajo));

    expect(r).toEqual({
      resultado: 'OMITIDA',
      motivo: 'EN_CURSO',
      ejecucionId: 99,
    });
    expect(trabajo).not.toHaveBeenCalled();
  });

  it('retoma una ejecución abandonada (arriendo vencido) con un intento más', async () => {
    const { repo, reloj, useCase } = preparar();
    await useCase.execute(entrada());
    repo.modificar(CLAVE, {
      estado: EstadoEjecucionTarea.EJECUTANDO,
      bloqueadoHasta: reloj.ahora(),
      finalizadaEn: null,
    });
    reloj.avanzar({ minutos: 1 });
    const trabajo = jest.fn(async (ctx: ContextoTareaProgramada) => {
      expect(ctx.intento).toBe(2);
    });

    const r = await useCase.execute(entrada(trabajo));

    expect(trabajo).toHaveBeenCalledTimes(1);
    expect(r).toMatchObject({
      resultado: 'EJECUTADA',
      estado: EstadoEjecucionTarea.COMPLETADA,
    });
    expect(repo.fila(CLAVE).intentos).toBe(2);
  });

  it('un DomainError deja la tarea fallida con su código y mensaje, sin propagarse', async () => {
    const { repo, useCase } = preparar();

    const r = await useCase.execute(
      entrada(async (ctx) => {
        ctx.contarProcesados(2);
        throw new SinPlantillaError();
      }),
    );

    expect(r).toMatchObject({
      resultado: 'EJECUTADA',
      estado: EstadoEjecucionTarea.FALLIDA,
      errorCodigo: 'PRUEBA_SIN_PLANTILLA',
    });
    expect(repo.fila(CLAVE)).toMatchObject({
      procesados: 2,
      errorMensaje: 'Falta la plantilla.',
    });
    expect(repo.fila(CLAVE).siguienteIntentoEn).not.toBeNull();
  });

  it('un error técnico no guarda su mensaje real', async () => {
    const { repo, useCase } = preparar();

    await useCase.execute(
      entrada(async () => {
        throw new Error('connect ECONNREFUSED 10.0.0.1:5432 usuario=secreto');
      }),
    );

    expect(repo.fila(CLAVE)).toMatchObject({
      errorCodigo: 'ERROR_INTERNO',
      errorMensaje: 'La tarea falló por un error inesperado.',
    });
  });

  it('una fallida espera su reintento, luego se retoma y al agotar intentos se deja', async () => {
    const { repo, reloj, useCase } = preparar();
    const falla = jest.fn(async () => {
      throw new SinPlantillaError();
    });

    await useCase.execute(entrada(falla));
    reloj.avanzar({ minutos: 10 });
    expect(await useCase.execute(entrada(falla))).toMatchObject({
      motivo: 'EN_ESPERA',
    });

    reloj.avanzar({ minutos: 15 });
    await useCase.execute(entrada(falla));
    reloj.avanzar({ minutos: 25 });
    await useCase.execute(entrada(falla));
    expect(repo.fila(CLAVE).intentos).toBe(3);

    reloj.avanzar({ minutos: 60 });
    expect(await useCase.execute(entrada(falla))).toMatchObject({
      motivo: 'AGOTADA',
    });
    expect(falla).toHaveBeenCalledTimes(3);
  });

  it('sin reintento, una fallida no se vuelve a ejecutar', async () => {
    const { repo, reloj, useCase } = preparar();
    const falla = jest.fn(async () => {
      throw new SinPlantillaError();
    });

    await useCase.execute(entrada(falla, { reintentable: false }));
    expect(repo.fila(CLAVE).siguienteIntentoEn).toBeNull();

    reloj.avanzar({ minutos: 60 });
    expect(
      await useCase.execute(entrada(falla, { reintentable: false })),
    ).toMatchObject({ resultado: 'OMITIDA', motivo: 'AGOTADA' });
    expect(falla).toHaveBeenCalledTimes(1);
  });

  it('sin reintento, una abandonada a la mitad no se retoma', async () => {
    const { repo, reloj, useCase } = preparar();
    await useCase.execute(entrada(async () => {}, { reintentable: false }));
    repo.modificar(CLAVE, {
      estado: EstadoEjecucionTarea.EJECUTANDO,
      bloqueadoHasta: reloj.ahora(),
      finalizadaEn: null,
    });
    reloj.avanzar({ minutos: 11 });
    const trabajo = jest.fn(async () => {});

    const r = await useCase.execute(entrada(trabajo, { reintentable: false }));

    expect(r).toMatchObject({ resultado: 'OMITIDA', motivo: 'AGOTADA' });
    expect(trabajo).not.toHaveBeenCalled();
  });

  it('a mano retoma una fallida sin esperar y registra quién la lanzó', async () => {
    const { repo, useCase } = preparar();
    await useCase.execute(
      entrada(async () => {
        throw new SinPlantillaError();
      }),
    );

    const r = await useCase.execute(
      entrada(async () => {}, {
        origen: OrigenEjecucionTarea.MANUAL,
        ejecutadaPorId: 7,
      }),
    );

    expect(r).toMatchObject({
      resultado: 'EJECUTADA',
      estado: EstadoEjecucionTarea.COMPLETADA,
    });
    expect(repo.fila(CLAVE)).toMatchObject({
      origen: OrigenEjecucionTarea.MANUAL,
      ejecutadaPorId: 7,
      intentos: 2,
      errorCodigo: null,
    });
  });

  it('renueva el arriendo mientras trabaja y detiene la renovación al terminar', async () => {
    const { repo, reloj, temporizador, useCase } = preparar();
    let arriendoDurante: Date | null = null;

    await useCase.execute(
      entrada(async () => {
        reloj.avanzar({ minutos: 8 });
        await temporizador.disparar();
        arriendoDurante = repo.fila(CLAVE).bloqueadoHasta;
      }),
    );

    expect(arriendoDurante).toEqual(new Date('2027-03-06T16:18:00.000Z'));
    expect(temporizador.cantidadActivos).toBe(0);
    expect(temporizador.detenidos).toBe(1);
  });

  it('si otra ejecución la retoma, el trabajo se entera y su resultado no pisa al nuevo', async () => {
    const { repo, temporizador, useCase } = preparar();
    let vigenteDespues: boolean | null = null;

    await useCase.execute(
      entrada(async (ctx) => {
        repo.modificar(CLAVE, { intentos: 2 });
        await temporizador.disparar();
        vigenteDespues = ctx.sigueVigente();
      }),
    );

    expect(vigenteDespues).toBe(false);
    expect(repo.fila(CLAVE)).toMatchObject({
      estado: EstadoEjecucionTarea.EJECUTANDO,
      intentos: 2,
    });
  });

  it(`guarda hasta ${MAXIMO_ERRORES_DETALLE} errores con detalle y cuenta el resto`, async () => {
    const { repo, useCase } = preparar();

    await useCase.execute(
      entrada(async (ctx) => {
        for (let i = 0; i < MAXIMO_ERRORES_DETALLE + 5; i++) {
          ctx.registrarError(`cliente-${i}`, 'ERROR');
        }
      }),
    );

    const fila = repo.fila(CLAVE);
    expect(fila.errores).toBe(MAXIMO_ERRORES_DETALLE + 5);
    expect(fila.resumen?.erroresDetalle).toHaveLength(MAXIMO_ERRORES_DETALLE);
    expect(fila.resumen?.erroresOmitidos).toBe(5);
  });

  it('sin nada que informar, el resumen queda vacío', async () => {
    const { repo, useCase } = preparar();
    await useCase.execute(entrada());
    expect(repo.fila(CLAVE).resumen).toBeNull();
  });
});
