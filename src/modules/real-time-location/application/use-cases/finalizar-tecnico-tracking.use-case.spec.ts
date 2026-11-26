import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';
import {
  TrackingSesionEstadoInvalidoError,
  TrackingSesionInconsistenteError,
  TrackingSesionNoEncontradaError,
} from '../../domain/errors/real-time-location.errors';
import { AsistenciaTrackingQueryFake } from '../../test/fakes/asistencia-tracking-query.fake';
import { RealTimeLocationTransactionFake } from '../../test/fakes/real-time-location-transaction.fake';
import { TecnicoTrackingRealtimeFake } from '../../test/fakes/tecnico-tracking-realtime.fake';
import { TecnicoTrackingRepositoryFake } from '../../test/fakes/tecnico-tracking-repository.fake';
import { FinalizarTecnicoTrackingUseCase } from './finalizar-tecnico-tracking.use-case';

const AHORA = new Date('2026-11-25T15:00:00.000Z');
const INPUT = { tecnicoId: 7, sesionTrackingId: 1 };

describe('FinalizarTecnicoTrackingUseCase', () => {
  let sesiones: TecnicoTrackingRepositoryFake;
  let asistencias: AsistenciaTrackingQueryFake;
  let transaccion: RealTimeLocationTransactionFake;
  let realtime: TecnicoTrackingRealtimeFake;
  let useCase: FinalizarTecnicoTrackingUseCase;

  beforeEach(() => {
    sesiones = new TecnicoTrackingRepositoryFake();
    asistencias = new AsistenciaTrackingQueryFake();
    transaccion = new RealTimeLocationTransactionFake(sesiones);
    realtime = new TecnicoTrackingRealtimeFake();
    useCase = new FinalizarTecnicoTrackingUseCase(
      sesiones,
      asistencias,
      transaccion,
      realtime,
      new RelojFijo(AHORA),
    );
  });

  it('cierra la sesión y la jornada con la hora del reloj y avisa por socket', async () => {
    sesiones.sembrar();

    const r = await useCase.execute(INPUT);

    expect(r).toMatchObject({
      sesionTrackingId: 1,
      asistenciaId: 50,
      estado: EstadoTrackingTecnico.FINALIZADA,
      finalizadoEn: AHORA,
      horaSalida: AHORA,
      duracionMinutos: 60,
    });
    expect(transaccion.cierresPedidos[0].horaSalida).toEqual(AHORA);
    expect(realtime.estados[0]).toMatchObject({
      estado: EstadoTrackingTecnico.FINALIZADA,
    });
  });

  it('es idempotente: una sesión ya finalizada se devuelve sin tocar la asistencia', async () => {
    const sesion = sesiones.sembrar();
    sesion.finalizar(new Date('2026-11-25T14:40:00.000Z'));
    asistencias.sembrar();

    const r = await useCase.execute(INPUT);

    expect(r.finalizadoEn).toEqual(new Date('2026-11-25T14:40:00.000Z'));
    expect(r.horaSalida).toEqual(new Date('2026-11-25T14:40:00.000Z'));
    expect(r.duracionMinutos).toBe(40);
    expect(transaccion.cierresPedidos).toHaveLength(0);
    expect(realtime.estados).toHaveLength(0);
  });

  it('si la jornada se reabrió, la hora de salida es la del cierre de esa sesión', async () => {
    const sesion = sesiones.sembrar();
    sesion.finalizar(new Date('2026-11-25T14:40:00.000Z'));
    asistencias.sembrar({ horaSalida: null });

    const r = await useCase.execute(INPUT);

    expect(r.horaSalida).toEqual(new Date('2026-11-25T14:40:00.000Z'));
  });

  it('una sesión expirada no se finaliza a mano', async () => {
    sesiones.sembrar().expirar();

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      TrackingSesionEstadoInvalidoError,
    );
    expect(transaccion.cierresPedidos).toHaveLength(0);
  });

  it('si expiró mientras se procesaba el cierre responde conflicto', async () => {
    sesiones.sembrar();
    const expirada = sesiones.sembrar({ tecnicoId: 99 });
    expirada.expirar();
    transaccion.finalizarTracking = () =>
      Promise.resolve({ sesion: expirada, asistencia: {} as never });

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      TrackingSesionEstadoInvalidoError,
    );
  });

  it('sesión inexistente, de otro técnico o sin asistencia', async () => {
    await expect(useCase.execute(INPUT)).rejects.toThrow(
      TrackingSesionNoEncontradaError,
    );

    sesiones.sembrar({ asistenciaId: null });

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      TrackingSesionInconsistenteError,
    );
  });
});
