import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';
import { TrackingDatosInvalidosError } from '../../domain/errors/real-time-location.errors';
import { RealTimeLocationTransactionFake } from '../../test/fakes/real-time-location-transaction.fake';
import { TecnicoTrackingRealtimeFake } from '../../test/fakes/tecnico-tracking-realtime.fake';
import { TecnicoTrackingRepositoryFake } from '../../test/fakes/tecnico-tracking-repository.fake';
import { IniciarTecnicoTrackingUseCase } from './iniciar-tecnico-tracking.use-case';

// 2026-11-26 05:30 UTC = 2026-11-25 23:30 en Guatemala.
const AHORA = new Date('2026-11-26T05:30:00.000Z');

describe('IniciarTecnicoTrackingUseCase', () => {
  let sesiones: TecnicoTrackingRepositoryFake;
  let transaccion: RealTimeLocationTransactionFake;
  let realtime: TecnicoTrackingRealtimeFake;
  let useCase: IniciarTecnicoTrackingUseCase;

  beforeEach(() => {
    sesiones = new TecnicoTrackingRepositoryFake();
    transaccion = new RealTimeLocationTransactionFake(sesiones);
    realtime = new TecnicoTrackingRealtimeFake();
    useCase = new IniciarTecnicoTrackingUseCase(
      sesiones,
      transaccion,
      realtime,
      new RelojFijo(AHORA),
    );
  });

  it('crea la sesión con la hora del reloj y el día laboral de Guatemala, y avisa por socket', async () => {
    const r = await useCase.execute({ tecnicoId: 7 });

    expect(r).toMatchObject({
      sesionTrackingId: 1,
      asistenciaId: 50,
      estado: EstadoTrackingTecnico.ACTIVA,
      iniciadoEn: AHORA,
    });
    expect(transaccion.iniciosPedidos[0]).toMatchObject({
      tecnicoId: 7,
      iniciadoEn: AHORA,
      fecha: new Date('2026-11-25T00:00:00.000Z'),
    });
    expect(realtime.estados).toHaveLength(1);
    expect(realtime.estados[0]).toMatchObject({
      tecnicoId: 7,
      sesionTrackingId: 1,
      estado: EstadoTrackingTecnico.ACTIVA,
    });
  });

  it('es idempotente: con una sesión activa devuelve la misma y no crea otra', async () => {
    const existente = sesiones.sembrar();

    const r = await useCase.execute({ tecnicoId: 7 });

    expect(r.sesionTrackingId).toBe(existente.id);
    expect(transaccion.iniciosPedidos).toHaveLength(0);
    expect(sesiones.sesiones.size).toBe(1);
    expect(realtime.estados).toHaveLength(1);
  });

  it('la sesión activa de otro técnico no cuenta', async () => {
    sesiones.sembrar({ tecnicoId: 99 });

    await useCase.execute({ tecnicoId: 7 });

    expect(transaccion.iniciosPedidos).toHaveLength(1);
  });

  it('rechaza un técnico inválido', async () => {
    await expect(useCase.execute({ tecnicoId: 0 })).rejects.toThrow(
      TrackingDatosInvalidosError,
    );
  });
});
