import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';
import { TrackingDatosInvalidosError } from '../../domain/errors/real-time-location.errors';
import { RealTimeLocationTransactionFake } from '../../test/fakes/real-time-location-transaction.fake';
import { TecnicoTrackingRealtimeFake } from '../../test/fakes/tecnico-tracking-realtime.fake';
import { TecnicoTrackingRepositoryFake } from '../../test/fakes/tecnico-tracking-repository.fake';
import { ExpirarTecnicoTrackingUseCase } from './expirar-tecnico-tracking.use-case';

const LIMITE = new Date('2026-11-25T14:30:00.000Z');

describe('ExpirarTecnicoTrackingUseCase', () => {
  let sesiones: TecnicoTrackingRepositoryFake;
  let transaccion: RealTimeLocationTransactionFake;
  let realtime: TecnicoTrackingRealtimeFake;
  let useCase: ExpirarTecnicoTrackingUseCase;

  beforeEach(() => {
    sesiones = new TecnicoTrackingRepositoryFake();
    transaccion = new RealTimeLocationTransactionFake(sesiones);
    realtime = new TecnicoTrackingRealtimeFake();
    useCase = new ExpirarTecnicoTrackingUseCase(
      sesiones,
      transaccion,
      realtime,
    );
  });

  it('expira las sesiones sin heartbeat reciente, en su último heartbeat, y avisa por socket', async () => {
    sesiones.sembrar({
      ultimoHeartbeatEn: new Date('2026-11-25T14:10:00.000Z'),
    });

    const r = await useCase.execute({ heartbeatBefore: LIMITE });

    expect(r).toMatchObject({
      encontradas: 1,
      expiradas: 1,
      omitidasPorConcurrencia: 0,
    });
    expect(r.sesionesExpiradas[0]).toMatchObject({
      sesionTrackingId: 1,
      finalizadoEn: new Date('2026-11-25T14:10:00.000Z'),
      duracionMinutos: 10,
    });
    expect(sesiones.sesiones.get(1)?.estado).toBe(
      EstadoTrackingTecnico.EXPIRADA,
    );
    expect(realtime.estados).toHaveLength(1);
  });

  it('no toca sesiones con actividad reciente ni sesiones ya cerradas', async () => {
    sesiones.sembrar({
      ultimoHeartbeatEn: new Date('2026-11-25T14:45:00.000Z'),
    });
    sesiones.sembrar().finalizar(new Date('2026-11-25T14:20:00.000Z'));

    const r = await useCase.execute({ heartbeatBefore: LIMITE });

    expect(r.encontradas).toBe(0);
    expect(realtime.estados).toHaveLength(0);
  });

  it('si llegó actividad entre la búsqueda y la expiración la omite sin error', async () => {
    sesiones.sembrar();
    transaccion.expirarTracking = () =>
      Promise.resolve({ applied: false, sesion: null, asistencia: null });

    const r = await useCase.execute({ heartbeatBefore: LIMITE });

    expect(r).toMatchObject({
      encontradas: 1,
      expiradas: 0,
      omitidasPorConcurrencia: 1,
    });
    expect(realtime.estados).toHaveLength(0);
  });

  it('procesa el lote pedido y recorta el máximo a 500', async () => {
    for (let i = 0; i < 3; i++) sesiones.sembrar({ tecnicoId: 10 + i });

    const r = await useCase.execute({ heartbeatBefore: LIMITE, limit: 2 });

    expect(r.encontradas).toBe(2);
    expect(r.expiradas).toBe(2);
  });

  it('rechaza una fecha límite o un lote inválidos', async () => {
    await expect(
      useCase.execute({ heartbeatBefore: new Date('x') }),
    ).rejects.toThrow(TrackingDatosInvalidosError);
    await expect(
      useCase.execute({ heartbeatBefore: LIMITE, limit: 0 }),
    ).rejects.toThrow(TrackingDatosInvalidosError);
  });
});
