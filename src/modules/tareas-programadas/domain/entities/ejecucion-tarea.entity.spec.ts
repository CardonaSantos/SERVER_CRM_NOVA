import {
  EstadoEjecucionTarea,
  OrigenEjecucionTarea,
  SituacionEjecucionTarea,
} from '../enums/ejecucion-tarea.enum';
import {
  EjecucionTareaEstadoInvalidoError,
  EjecucionTareaInvalidaError,
} from '../errors/tareas-programadas.errors';
import {
  DURACION_ARRIENDO_MS,
  ESPERA_REINTENTO_MS,
  MAXIMO_INTENTOS_TAREA,
} from '../policies/arriendo.policy';
import { EjecucionTareaEntity } from './ejecucion-tarea.entity';

const AHORA = new Date('2027-03-06T16:00:00.000Z');
const minutos = (n: number) => new Date(AHORA.getTime() + n * 60_000);
const PROGRAMADA = {
  origen: OrigenEjecucionTarea.PROGRAMADA,
  ejecutadaPorId: null,
};
const SIN_RESULTADO = { procesados: 0, errores: 0, resumen: null };

function nueva(): EjecucionTareaEntity {
  return EjecucionTareaEntity.iniciar(
    {
      clave: 'LIMPIEZA:2027-03-06',
      tarea: 'LIMPIEZA',
      fechaOperativa: '2027-03-06',
      origen: OrigenEjecucionTarea.PROGRAMADA,
    },
    AHORA,
  );
}

function fallida(intentos = 1): EjecucionTareaEntity {
  const e = EjecucionTareaEntity.hydrate({
    ...nueva().toPrimitives(),
    id: 1,
    intentos,
  });
  e.fallar({ codigo: 'X', mensaje: 'falló' }, SIN_RESULTADO, AHORA);
  return e;
}

describe('EjecucionTareaEntity', () => {
  it('nace en ejecución, con el primer intento y el arriendo de 10 minutos', () => {
    const e = nueva().toPrimitives();

    expect(e.estado).toBe(EstadoEjecucionTarea.EJECUTANDO);
    expect(e.intentos).toBe(1);
    expect(e.bloqueadoHasta).toEqual(
      new Date(AHORA.getTime() + DURACION_ARRIENDO_MS),
    );
    expect(e.iniciadaEn).toEqual(AHORA);
  });

  it.each([
    ['clave vacía', { clave: '   ' }],
    ['tarea en minúsculas', { tarea: 'limpieza' }],
    ['fecha inexistente', { fechaOperativa: '2027-02-30' }],
    ['fecha con hora', { fechaOperativa: '2027-03-06T00:00' }],
  ])('rechaza %s', (_caso, cambio) => {
    expect(() =>
      EjecucionTareaEntity.iniciar(
        {
          clave: 'LIMPIEZA:2027-03-06',
          tarea: 'LIMPIEZA',
          fechaOperativa: '2027-03-06',
          origen: OrigenEjecucionTarea.PROGRAMADA,
          ...cambio,
        },
        AHORA,
      ),
    ).toThrow(EjecucionTareaInvalidaError);
  });

  it('completa sin errores o con errores según lo informado', () => {
    const limpia = nueva();
    limpia.completar({ procesados: 10, errores: 0, resumen: null }, minutos(3));
    expect(limpia.toPrimitives()).toMatchObject({
      estado: EstadoEjecucionTarea.COMPLETADA,
      procesados: 10,
      bloqueadoHasta: null,
      finalizadaEn: minutos(3),
    });

    const conErrores = nueva();
    conErrores.completar(
      { procesados: 10, errores: 2, resumen: null },
      minutos(3),
    );
    expect(conErrores.estado).toBe(EstadoEjecucionTarea.COMPLETADA_CON_ERRORES);
  });

  it('al fallar programa el reintento mientras queden intentos', () => {
    const e = fallida(1).toPrimitives();

    expect(e.estado).toBe(EstadoEjecucionTarea.FALLIDA);
    expect(e.siguienteIntentoEn).toEqual(
      new Date(AHORA.getTime() + ESPERA_REINTENTO_MS),
    );
    expect(e.errorCodigo).toBe('X');
    expect(
      fallida(MAXIMO_INTENTOS_TAREA).toPrimitives().siguienteIntentoEn,
    ).toBeNull();
  });

  it('recorta el mensaje de error', () => {
    const e = nueva();
    e.fallar({ codigo: 'X', mensaje: 'a'.repeat(900) }, SIN_RESULTADO, AHORA);
    expect(e.toPrimitives().errorMensaje).toHaveLength(500);
  });

  describe('situacion', () => {
    it('completada en cualquiera de sus dos formas', () => {
      const e = nueva();
      e.completar({ procesados: 1, errores: 1, resumen: null }, AHORA);
      expect(e.situacion(minutos(60), { ignorarLimites: true })).toBe(
        SituacionEjecucionTarea.COMPLETADA,
      );
    });

    it('en curso mientras el arriendo esté vigente; retomable al vencer', () => {
      const e = nueva();
      expect(e.situacion(minutos(9))).toBe(SituacionEjecucionTarea.EN_CURSO);
      expect(e.situacion(minutos(9), { ignorarLimites: true })).toBe(
        SituacionEjecucionTarea.EN_CURSO,
      );
      expect(e.situacion(minutos(10))).toBe(SituacionEjecucionTarea.RETOMABLE);
    });

    it('abandonada en el último intento queda agotada', () => {
      const e = EjecucionTareaEntity.hydrate({
        ...nueva().toPrimitives(),
        intentos: MAXIMO_INTENTOS_TAREA,
      });
      expect(e.situacion(minutos(11))).toBe(SituacionEjecucionTarea.AGOTADA);
    });

    it('fallida: en espera, luego retomable; agotada sin intentos', () => {
      const e = fallida(1);
      expect(e.situacion(minutos(19))).toBe(SituacionEjecucionTarea.EN_ESPERA);
      expect(e.situacion(minutos(20))).toBe(SituacionEjecucionTarea.RETOMABLE);
      expect(fallida(MAXIMO_INTENTOS_TAREA).situacion(minutos(60))).toBe(
        SituacionEjecucionTarea.AGOTADA,
      );
    });

    it('con un solo intento, ni la abandonada ni la fallida se retoman', () => {
      const limites = { maximoIntentos: 1 };
      expect(nueva().situacion(minutos(11), limites)).toBe(
        SituacionEjecucionTarea.AGOTADA,
      );
      const e = nueva();
      e.fallar({ codigo: 'X', mensaje: 'x' }, SIN_RESULTADO, AHORA, limites);
      expect(e.toPrimitives().siguienteIntentoEn).toBeNull();
      expect(e.situacion(minutos(60), limites)).toBe(
        SituacionEjecucionTarea.AGOTADA,
      );
    });

    it('rechaza límites de intentos fuera de 1 a 3', () => {
      expect(() =>
        nueva().situacion(minutos(11), { maximoIntentos: 0 }),
      ).toThrow(EjecucionTareaInvalidaError);
      expect(() =>
        nueva().situacion(minutos(11), { maximoIntentos: 4 }),
      ).toThrow(EjecucionTareaInvalidaError);
    });

    it('a mano se puede retomar una fallida sin esperar ni con intentos agotados', () => {
      const opciones = { ignorarLimites: true };
      expect(fallida(1).situacion(minutos(1), opciones)).toBe(
        SituacionEjecucionTarea.RETOMABLE,
      );
      expect(
        fallida(MAXIMO_INTENTOS_TAREA).situacion(minutos(1), opciones),
      ).toBe(SituacionEjecucionTarea.RETOMABLE);
    });
  });

  it('retomar suma un intento, renueva el arriendo y limpia lo del intento anterior', () => {
    const e = fallida(1);
    e.retomar(
      { origen: OrigenEjecucionTarea.MANUAL, ejecutadaPorId: 7 },
      minutos(30),
    );

    expect(e.toPrimitives()).toMatchObject({
      estado: EstadoEjecucionTarea.EJECUTANDO,
      intentos: 2,
      origen: OrigenEjecucionTarea.MANUAL,
      ejecutadaPorId: 7,
      bloqueadoHasta: new Date(minutos(30).getTime() + DURACION_ARRIENDO_MS),
      siguienteIntentoEn: null,
      finalizadaEn: null,
      iniciadaEn: AHORA,
    });
  });

  it('no retoma lo que no está disponible', () => {
    expect(() => nueva().retomar(PROGRAMADA, minutos(5))).toThrow(
      EjecucionTareaEstadoInvalidoError,
    );
    expect(() => fallida(1).retomar(PROGRAMADA, minutos(5))).toThrow(
      EjecucionTareaEstadoInvalidoError,
    );
  });

  it('solo renueva, completa o falla mientras está en ejecución', () => {
    const e = fallida(1);
    expect(() => e.renovarArriendo(AHORA)).toThrow(
      EjecucionTareaEstadoInvalidoError,
    );
    expect(() => e.completar(SIN_RESULTADO, AHORA)).toThrow(
      EjecucionTareaEstadoInvalidoError,
    );
    expect(() =>
      e.fallar({ codigo: 'X', mensaje: 'x' }, SIN_RESULTADO, AHORA),
    ).toThrow(EjecucionTareaEstadoInvalidoError);
  });

  it('devuelve copias', () => {
    const e = nueva();
    e.bloqueadoHasta?.setFullYear(2000);
    expect(e.bloqueadoHasta?.getUTCFullYear()).toBe(2027);
  });
});
