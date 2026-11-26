import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';
import {
  TrackingDatosInvalidosError,
  TrackingSesionEstadoInvalidoError,
  TrackingSesionNoEncontradaError,
} from '../../domain/errors/real-time-location.errors';
import { TecnicoTrackingRealtimeView } from '../../domain/read-models/tecnico-tracking.read-model';
import { UltimaUbicacionReadModel } from '../../domain/read-models/ultima-ubicacion.read-model';
import { RealTimeLocationTransactionFake } from '../../test/fakes/real-time-location-transaction.fake';
import { TecnicoTrackingQueryFake } from '../../test/fakes/tecnico-tracking-query.fake';
import { TecnicoTrackingRealtimeFake } from '../../test/fakes/tecnico-tracking-realtime.fake';
import {
  INICIO,
  TecnicoTrackingRepositoryFake,
} from '../../test/fakes/tecnico-tracking-repository.fake';
import { UltimaUbicacionQueryFake } from '../../test/fakes/ultima-ubicacion-query.fake';
import {
  RegistrarUbicacionTecnicoInput,
  RegistrarUbicacionTecnicoUseCase,
} from './registrar-ubicacion-tecnico.use-case';

const AHORA = new Date('2026-11-25T14:30:00.000Z');
const CAPTURADO = new Date('2026-11-25T14:29:50.000Z');

const INPUT: RegistrarUbicacionTecnicoInput = {
  tecnicoId: 7,
  sesionTrackingId: 1,
  latitud: 14.6,
  longitud: -90.5,
  precision: 5,
  velocidad: 1,
  bateria: 70,
  capturadoEn: CAPTURADO,
};

describe('RegistrarUbicacionTecnicoUseCase', () => {
  let sesiones: TecnicoTrackingRepositoryFake;
  let transaccion: RealTimeLocationTransactionFake;
  let consulta: TecnicoTrackingQueryFake;
  let realtime: TecnicoTrackingRealtimeFake;
  let ultimas: UltimaUbicacionQueryFake;
  let useCase: RegistrarUbicacionTecnicoUseCase;

  beforeEach(() => {
    sesiones = new TecnicoTrackingRepositoryFake();
    transaccion = new RealTimeLocationTransactionFake(sesiones);
    consulta = new TecnicoTrackingQueryFake();
    realtime = new TecnicoTrackingRealtimeFake();
    ultimas = new UltimaUbicacionQueryFake();
    useCase = new RegistrarUbicacionTecnicoUseCase(
      sesiones,
      transaccion,
      consulta,
      realtime,
      ultimas,
      new RelojFijo(AHORA),
    );
  });

  it('guarda el punto, usa la hora del servidor como heartbeat y emite la vista en vivo', async () => {
    sesiones.sembrar();
    consulta.vistaRealtime = {
      tecnico: { id: 7 },
    } as TecnicoTrackingRealtimeView;

    const r = await useCase.execute(INPUT);

    expect(r).toMatchObject({
      ubicacionId: 1,
      sesionTrackingId: 1,
      estado: EstadoTrackingTecnico.ACTIVA,
      capturadoEn: CAPTURADO,
      ultimoHeartbeatEn: AHORA,
    });
    expect(transaccion.ubicaciones).toHaveLength(1);
    expect(realtime.ubicaciones).toHaveLength(1);
  });

  it('el heartbeat no usa la hora del dispositivo', async () => {
    sesiones.sembrar();

    await useCase.execute({
      ...INPUT,
      capturadoEn: new Date(INICIO.getTime() + 1000),
    });

    expect(sesiones.sesiones.get(1)?.ultimoHeartbeatEn).toEqual(AHORA);
  });

  it('sesión inexistente o de otro técnico', async () => {
    sesiones.sembrar({ tecnicoId: 99 });

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      TrackingSesionNoEncontradaError,
    );
  });

  it('una sesión cerrada no recibe puntos', async () => {
    const sesion = sesiones.sembrar();
    sesion.finalizar(AHORA);

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      TrackingSesionEstadoInvalidoError,
    );
    expect(transaccion.ubicaciones).toHaveLength(0);
  });

  it('si la sesión se cerró durante la escritura responde conflicto y no emite', async () => {
    sesiones.sembrar();
    transaccion.registrarUbicacion = () =>
      Promise.resolve({ applied: false, sesion: null, ubicacion: null });

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      TrackingSesionEstadoInvalidoError,
    );
    expect(realtime.ubicaciones).toHaveLength(0);
  });

  it('coordenadas inválidas se rechazan sin guardar', async () => {
    sesiones.sembrar();

    await expect(useCase.execute({ ...INPUT, latitud: 120 })).rejects.toThrow(
      TrackingDatosInvalidosError,
    );
    expect(transaccion.ubicaciones).toHaveLength(0);
  });

  it('si falla la vista en vivo el punto ya guardado no se pierde ni da error', async () => {
    sesiones.sembrar();
    consulta.fallaVistaRealtime = new Error('consulta caída');

    await expect(useCase.execute(INPUT)).resolves.toMatchObject({
      ubicacionId: 1,
    });
    expect(transaccion.ubicaciones).toHaveLength(1);
    expect(realtime.ubicaciones).toHaveLength(0);
  });

  it('emite la posición actual para el mapa del dashboard', async () => {
    sesiones.sembrar();
    const actual = { usuarioId: 7 } as UltimaUbicacionReadModel;
    ultimas.ubicaciones = [actual];

    await useCase.execute(INPUT);

    expect(realtime.ultimas).toEqual([actual]);
  });

  it('si falla la vista de la sesión igual emite la posición actual', async () => {
    sesiones.sembrar();
    consulta.fallaVistaRealtime = new Error('consulta caída');
    ultimas.ubicaciones = [{ usuarioId: 7 } as UltimaUbicacionReadModel];

    await useCase.execute(INPUT);

    expect(realtime.ultimas).toHaveLength(1);
  });

  it('si falla la posición actual el punto se guarda y la vista se emite', async () => {
    sesiones.sembrar();
    consulta.vistaRealtime = {
      tecnico: { id: 7 },
    } as TecnicoTrackingRealtimeView;
    ultimas.fallaPorUsuario = new Error('consulta caída');

    await expect(useCase.execute(INPUT)).resolves.toMatchObject({
      ubicacionId: 1,
    });
    expect(realtime.ubicaciones).toHaveLength(1);
    expect(realtime.ultimas).toHaveLength(0);
  });

  it('si ya no hay sesión activa para la vista (un OFF ganó) no emite nada', async () => {
    sesiones.sembrar();
    consulta.vistaRealtime = null;

    await useCase.execute(INPUT);

    expect(realtime.ubicaciones).toHaveLength(0);
  });
});
