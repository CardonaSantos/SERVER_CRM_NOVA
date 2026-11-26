import { TrackingDatosInvalidosError } from '../../domain/errors/real-time-location.errors';
import { TrackingAsistenciaNoEncontradaError } from '../../domain/errors/real-time-location.errors';
import { TecnicoTrackingAsistenciaDetalle } from '../../domain/read-models/tecnico-tracking.read-model';
import { TecnicoTrackingQueryFake } from '../../test/fakes/tecnico-tracking-query.fake';
import { TecnicoTrackingRepositoryFake } from '../../test/fakes/tecnico-tracking-repository.fake';
import { ListarHistorialTecnicoTrackingUseCase } from './listar-historial-tecnico-tracking.use-case';
import { ListarUbicacionesAsistenciaTrackingUseCase } from './listar-ubicaciones-asistencia-tracking.use-case';
import { ObtenerDetalleAsistenciaTrackingUseCase } from './obtener-detalle-asistencia-tracking.use-case';
import { ObtenerEstadoTrackingTecnicoUseCase } from './obtener-estado-tracking-tecnico.use-case';

describe('consultas de tracking', () => {
  let consulta: TecnicoTrackingQueryFake;

  beforeEach(() => {
    consulta = new TecnicoTrackingQueryFake();
  });

  describe('historial', () => {
    it('normaliza la paginación (por defecto 1 y 10, máximo 100) y los filtros', async () => {
      const useCase = new ListarHistorialTecnicoTrackingUseCase(consulta);

      await useCase.execute({ search: '  ana ', tecnicoId: 7, limit: 500 });

      expect(consulta.paginacionHistorial).toEqual({ page: 1, limit: 100 });
      expect(consulta.filtrosHistorial).toMatchObject({
        search: 'ana',
        tecnicoId: 7,
        fechaDesde: null,
        estadoSesion: null,
      });
    });

    it('convierte las fechas ISO y rechaza fechas inválidas o rangos al revés', async () => {
      const useCase = new ListarHistorialTecnicoTrackingUseCase(consulta);

      await useCase.execute({ fechaDesde: '2026-11-01T00:00:00.000Z' });

      expect(consulta.filtrosHistorial?.fechaDesde).toEqual(
        new Date('2026-11-01T00:00:00.000Z'),
      );
      expect(() => useCase.execute({ fechaDesde: 'nada' })).toThrow(
        TrackingDatosInvalidosError,
      );
      expect(() =>
        useCase.execute({
          fechaDesde: '2026-11-10T00:00:00.000Z',
          fechaHasta: '2026-11-01T00:00:00.000Z',
        }),
      ).toThrow(TrackingDatosInvalidosError);
    });
  });

  describe('recorrido GPS', () => {
    it('usa lotes de 250 por defecto y hasta 1000', async () => {
      const useCase = new ListarUbicacionesAsistenciaTrackingUseCase(consulta);

      await useCase.execute({ asistenciaId: 50 });
      expect(consulta.paginacionUbicaciones).toEqual({ page: 1, limit: 250 });

      await useCase.execute({
        asistenciaId: 50,
        limit: 5000,
        sesionTrackingId: 3,
      });
      expect(consulta.paginacionUbicaciones).toEqual({ page: 1, limit: 1000 });
      expect(consulta.filtrosUbicaciones).toEqual({
        asistenciaId: 50,
        sesionTrackingId: 3,
      });
    });
  });

  describe('detalle de jornada', () => {
    it('devuelve el detalle o 404 de dominio', async () => {
      const useCase = new ObtenerDetalleAsistenciaTrackingUseCase(consulta);

      await expect(useCase.execute({ asistenciaId: 50 })).rejects.toThrow(
        TrackingAsistenciaNoEncontradaError,
      );

      const detalle = {
        sesiones: [],
      } as unknown as TecnicoTrackingAsistenciaDetalle;
      consulta.detalle = detalle;

      await expect(useCase.execute({ asistenciaId: 50 })).resolves.toBe(
        detalle,
      );
    });
  });

  describe('estado del técnico', () => {
    it('sin sesión activa responde inactivo y con ella sus datos', async () => {
      const sesiones = new TecnicoTrackingRepositoryFake();
      const useCase = new ObtenerEstadoTrackingTecnicoUseCase(sesiones);

      await expect(useCase.execute({ tecnicoId: 7 })).resolves.toMatchObject({
        activo: false,
        sesionTrackingId: null,
      });

      sesiones.sembrar();

      await expect(useCase.execute({ tecnicoId: 7 })).resolves.toMatchObject({
        activo: true,
        sesionTrackingId: 1,
        asistenciaId: 50,
      });
    });
  });
});
