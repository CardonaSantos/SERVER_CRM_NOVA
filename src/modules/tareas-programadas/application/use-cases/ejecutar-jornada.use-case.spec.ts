import { DomainError } from 'src/common/hexagonal/domain-error';
import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import {
  EstadoEjecucionTarea,
  OrigenEjecucionTarea,
} from '../../domain/enums/ejecucion-tarea.enum';
import { FaseJornada, MomentoJornada } from '../../domain/enums/jornada.enum';
import { EtapaJornadaInvalidaError } from '../../domain/errors/tareas-programadas.errors';
import {
  ContextoEtapaJornada,
  RegistrarEtapaInput,
} from '../../public/tareas-programadas.facade.port';
import { EjecucionTareaRepositoryFake } from '../../test/fakes/ejecucion-tarea-repository.fake';
import { TemporizadorFake } from '../../test/fakes/temporizador.fake';
import { RegistroEtapasJornadaService } from '../services/registro-etapas-jornada.service';
import { EjecutarJornadaUseCase } from './ejecutar-jornada.use-case';
import { EjecutarTareaProgramadaUseCase } from './ejecutar-tarea-programada.use-case';

const FECHA = '2027-03-06';
const JORNADA = `JORNADA:${FECHA}`;
// 16:00 UTC = 10:00 de Guatemala.
const DIEZ_GT = '2027-03-06T16:00:00.000Z';

class SinPlantillaError extends DomainError {
  readonly codigo = 'PRUEBA_SIN_PLANTILLA';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('Falta la plantilla.');
  }
}

function preparar({ activas = true, ahora = DIEZ_GT } = {}) {
  const reloj = new RelojFijo(ahora);
  const repo = new EjecucionTareaRepositoryFake();
  const tareas = new EjecutarTareaProgramadaUseCase(
    repo,
    { activas },
    new TemporizadorFake(),
    reloj,
  );
  const registro = new RegistroEtapasJornadaService();
  const useCase = new EjecutarJornadaUseCase(tareas, registro, reloj);
  return { reloj, repo, registro, useCase };
}

/** Una etapa que hace un paso por zona y anota en `orden` cuándo corrió. */
function etapaPorZonas(
  tarea: string,
  zonas: number[],
  opciones: {
    fase?: FaseJornada;
    orden?: number;
    reintentable?: boolean;
    trabajo?: (zonaId: number) => Promise<void>;
    corridas?: string[];
  } = {},
): RegistrarEtapaInput {
  return {
    tarea,
    fase: opciones.fase ?? FaseJornada.FACTURACION,
    orden: opciones.orden ?? 10,
    ejecutar: async (etapa: ContextoEtapaJornada) => {
      opciones.corridas?.push(tarea);
      for (const zonaId of zonas) {
        await etapa.ejecutarPaso({
          clave: `${tarea}:zona-${zonaId}:${etapa.fechaOperativa}`,
          tarea,
          facturacionZonaId: zonaId,
          reintentable: opciones.reintentable,
          trabajo: async (paso) => {
            paso.contarProcesados();
            await opciones.trabajo?.(zonaId);
          },
        });
      }
    },
  };
}

describe('EjecutarJornadaUseCase', () => {
  it('recorre las etapas por fase y orden, cada paso con la fecha de la jornada', async () => {
    const { repo, registro, useCase } = preparar();
    const corridas: string[] = [];
    registro.registrar(
      etapaPorZonas('EVALUAR_MORA', [1], {
        fase: FaseJornada.COBRANZA,
        corridas,
      }),
    );
    registro.registrar(
      etapaPorZonas('ENVIAR_RECORDATORIO_1', [1], { orden: 30, corridas }),
    );
    registro.registrar(
      etapaPorZonas('GENERAR_FACTURAS', [1, 2], { orden: 10, corridas }),
    );

    const r = await useCase.execute({ momento: MomentoJornada.JORNADA });

    expect(corridas).toEqual([
      'GENERAR_FACTURAS',
      'ENVIAR_RECORDATORIO_1',
      'EVALUAR_MORA',
    ]);
    expect(r).toMatchObject({
      jornada: {
        resultado: 'EJECUTADA',
        estado: EstadoEjecucionTarea.COMPLETADA,
      },
      repasoEjecutado: false,
    });
    expect(repo.fila(`GENERAR_FACTURAS:zona-2:${FECHA}`)).toMatchObject({
      fechaOperativa: FECHA,
      facturacionZonaId: 2,
      origen: OrigenEjecucionTarea.PROGRAMADA,
      estado: EstadoEjecucionTarea.COMPLETADA,
      procesados: 1,
    });
    expect(repo.fila(JORNADA)).toMatchObject({
      tarea: 'JORNADA',
      procesados: 3,
      resumen: { datos: { pasosCompletados: 4, pasosFallidos: 0 } },
    });
  });

  it('con el interruptor apagado no corre ninguna etapa', async () => {
    const { repo, registro, useCase } = preparar({ activas: false });
    const corridas: string[] = [];
    registro.registrar(etapaPorZonas('GENERAR_FACTURAS', [1], { corridas }));

    const r = await useCase.execute({ momento: MomentoJornada.JORNADA });

    expect(r.jornada).toMatchObject({
      resultado: 'OMITIDA',
      motivo: 'APAGADO',
    });
    expect(corridas).toEqual([]);
    expect(repo.filas.size).toBe(0);
  });

  it.each([
    ['antes de las 10:00', '2027-03-06T15:59:00.000Z'],
    ['a las 18:00', '2027-03-07T00:00:00.000Z'],
    ['de noche', '2027-03-07T05:30:00.000Z'],
  ])('fuera de la ventana (%s) no empieza nada', async (_, ahora) => {
    const { repo, registro, useCase } = preparar({ ahora });
    const corridas: string[] = [];
    registro.registrar(etapaPorZonas('GENERAR_FACTURAS', [1], { corridas }));

    for (const momento of [MomentoJornada.JORNADA, MomentoJornada.REPASO]) {
      expect((await useCase.execute({ momento })).jornada).toMatchObject({
        resultado: 'OMITIDA',
        motivo: 'FUERA_DE_VENTANA',
      });
    }
    expect(corridas).toEqual([]);
    expect(repo.filas.size).toBe(0);
  });

  it('una etapa que lanza se anota y la jornada sigue con las demás', async () => {
    const { repo, registro, useCase } = preparar();
    const corridas: string[] = [];
    registro.registrar({
      tarea: 'GENERAR_FACTURAS',
      fase: FaseJornada.FACTURACION,
      orden: 10,
      ejecutar: async () => {
        throw new SinPlantillaError();
      },
    });
    registro.registrar(
      etapaPorZonas('ENVIAR_RECORDATORIO_1', [1], { orden: 30, corridas }),
    );

    const r = await useCase.execute({ momento: MomentoJornada.JORNADA });

    expect(corridas).toEqual(['ENVIAR_RECORDATORIO_1']);
    expect(r.jornada).toMatchObject({
      estado: EstadoEjecucionTarea.COMPLETADA_CON_ERRORES,
    });
    expect(repo.fila(JORNADA).resumen).toMatchObject({
      datos: { etapasFallidas: 1 },
      erroresDetalle: [
        {
          referencia: 'etapa-GENERAR_FACTURAS',
          codigo: 'PRUEBA_SIN_PLANTILLA',
        },
      ],
    });
  });

  it('un paso fallido queda en la jornada con su clave y su código', async () => {
    const { repo, registro, useCase } = preparar();
    registro.registrar(
      etapaPorZonas('GENERAR_FACTURAS', [1, 2], {
        trabajo: async (zonaId) => {
          if (zonaId === 2) throw new SinPlantillaError();
        },
      }),
    );

    await useCase.execute({ momento: MomentoJornada.JORNADA });

    expect(repo.fila(`GENERAR_FACTURAS:zona-1:${FECHA}`).estado).toBe(
      EstadoEjecucionTarea.COMPLETADA,
    );
    expect(repo.fila(`GENERAR_FACTURAS:zona-2:${FECHA}`).estado).toBe(
      EstadoEjecucionTarea.FALLIDA,
    );
    expect(repo.fila(JORNADA)).toMatchObject({
      estado: EstadoEjecucionTarea.COMPLETADA_CON_ERRORES,
      resumen: {
        datos: { pasosCompletados: 1, pasosFallidos: 1 },
        erroresDetalle: [
          {
            referencia: `GENERAR_FACTURAS:zona-2:${FECHA}`,
            codigo: 'PRUEBA_SIN_PLANTILLA',
          },
        ],
      },
    });
  });

  it('el repaso no repite lo completado y retoma lo fallido cuando llega su reintento', async () => {
    const { reloj, registro, useCase } = preparar();
    const llamadas: number[] = [];
    let fallar = true;
    registro.registrar(
      etapaPorZonas('EVALUAR_MORA', [1, 2], {
        fase: FaseJornada.COBRANZA,
        trabajo: async (zonaId) => {
          llamadas.push(zonaId);
          if (zonaId === 2 && fallar) throw new SinPlantillaError();
        },
      }),
    );
    await useCase.execute({ momento: MomentoJornada.JORNADA });
    expect(llamadas).toEqual([1, 2]);

    // 10:15: la zona 2 todavía espera su reintento (20 min).
    reloj.avanzar({ minutos: 15 });
    const antes = await useCase.execute({ momento: MomentoJornada.REPASO });
    expect(antes).toMatchObject({
      jornada: { resultado: 'OMITIDA', motivo: 'COMPLETADA' },
      repasoEjecutado: true,
    });
    expect(llamadas).toEqual([1, 2]);

    // 10:30: la retoma; la zona 1 no se repite.
    fallar = false;
    reloj.avanzar({ minutos: 15 });
    await useCase.execute({ momento: MomentoJornada.REPASO });
    expect(llamadas).toEqual([1, 2, 2]);
  });

  it('el repaso no retoma un paso sin reintento', async () => {
    const { reloj, registro, useCase } = preparar();
    const llamadas: number[] = [];
    registro.registrar(
      etapaPorZonas('ENVIAR_RECORDATORIO_1', [1], {
        reintentable: false,
        trabajo: async (zonaId) => {
          llamadas.push(zonaId);
          throw new SinPlantillaError();
        },
      }),
    );
    await useCase.execute({ momento: MomentoJornada.JORNADA });

    reloj.avanzar({ minutos: 60 });
    await useCase.execute({ momento: MomentoJornada.REPASO });

    expect(llamadas).toEqual([1]);
  });

  it('el repaso no hace nada mientras la jornada está en curso', async () => {
    const { reloj, registro, useCase } = preparar();
    let repaso: unknown;
    registro.registrar({
      tarea: 'GENERAR_FACTURAS',
      fase: FaseJornada.FACTURACION,
      orden: 10,
      ejecutar: async () => {
        reloj.avanzar({ minutos: 5 });
        repaso = await useCase.execute({ momento: MomentoJornada.REPASO });
      },
    });

    await useCase.execute({ momento: MomentoJornada.JORNADA });

    expect(repaso).toEqual({
      jornada: { resultado: 'OMITIDA', motivo: 'EN_CURSO', ejecucionId: 1 },
      repasoEjecutado: false,
    });
  });

  it('el repaso retoma una jornada abandonada (el proceso murió a la mitad)', async () => {
    const { reloj, repo, registro, useCase } = preparar();
    const momentos: MomentoJornada[] = [];
    registro.registrar({
      tarea: 'GENERAR_FACTURAS',
      fase: FaseJornada.FACTURACION,
      orden: 10,
      ejecutar: async (etapa) => void momentos.push(etapa.momento),
    });
    await useCase.execute({ momento: MomentoJornada.JORNADA });
    repo.modificar(JORNADA, {
      estado: EstadoEjecucionTarea.EJECUTANDO,
      bloqueadoHasta: reloj.ahora(),
      finalizadaEn: null,
    });

    reloj.avanzar({ minutos: 30 });
    const r = await useCase.execute({ momento: MomentoJornada.REPASO });

    expect(r).toMatchObject({
      jornada: {
        resultado: 'EJECUTADA',
        estado: EstadoEjecucionTarea.COMPLETADA,
      },
      repasoEjecutado: false,
    });
    expect(repo.fila(JORNADA).intentos).toBe(2);
    expect(momentos).toEqual([MomentoJornada.JORNADA, MomentoJornada.REPASO]);
  });

  it('a las 18:00 deja de empezar etapas y pasos', async () => {
    const { reloj, repo, registro, useCase } = preparar({
      ahora: '2027-03-06T23:50:00.000Z', // 17:50 de Guatemala
    });
    const corridas: string[] = [];
    let pasoTarde: unknown;
    registro.registrar({
      tarea: 'GENERAR_FACTURAS',
      fase: FaseJornada.FACTURACION,
      orden: 10,
      ejecutar: async (etapa) => {
        corridas.push('GENERAR_FACTURAS');
        expect(etapa.dentroDeVentana()).toBe(true);
        reloj.avanzar({ minutos: 10 });
        expect(etapa.dentroDeVentana()).toBe(false);
        pasoTarde = await etapa.ejecutarPaso({
          clave: `GENERAR_FACTURAS:zona-1:${FECHA}`,
          tarea: 'GENERAR_FACTURAS',
          trabajo: async () => {},
        });
      },
    });
    registro.registrar(
      etapaPorZonas('ENVIAR_RECORDATORIO_1', [1], { orden: 30, corridas }),
    );

    await useCase.execute({ momento: MomentoJornada.REPASO });

    expect(pasoTarde).toMatchObject({ motivo: 'FUERA_DE_VENTANA' });
    expect(corridas).toEqual(['GENERAR_FACTURAS']);
    expect(repo.fila(JORNADA).resumen?.datos).toMatchObject({
      cortadaPorVentana: true,
      pasosOmitidos: 1,
    });
  });

  it('el registro rechaza una etapa repetida en la misma fase', () => {
    const { registro } = preparar();
    registro.registrar(etapaPorZonas('GENERAR_FACTURAS', [1]));
    expect(() =>
      registro.registrar(etapaPorZonas('GENERAR_FACTURAS', [2], { orden: 99 })),
    ).toThrow(EtapaJornadaInvalidaError);
  });
});
