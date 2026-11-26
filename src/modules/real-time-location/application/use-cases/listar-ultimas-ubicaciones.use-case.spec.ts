import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UltimaUbicacionReadModel } from '../../domain/read-models/ultima-ubicacion.read-model';
import { UltimaUbicacionQueryFake } from '../../test/fakes/ultima-ubicacion-query.fake';
import { ListarUltimasUbicacionesUseCase } from './listar-ultimas-ubicaciones.use-case';

const AHORA = new Date('2026-11-25T14:30:00.000Z');

function ubicacion(usuarioId: number, fecha: string) {
  return {
    usuarioId,
    actualizadoEn: new Date(fecha),
  } as UltimaUbicacionReadModel;
}

describe('ListarUltimasUbicacionesUseCase', () => {
  it('solo devuelve quienes reportaron en la última hora', async () => {
    const consulta = new UltimaUbicacionQueryFake();
    consulta.ubicaciones = [
      ubicacion(1, '2026-11-25T14:00:00.000Z'),
      ubicacion(2, '2026-11-25T13:30:00.000Z'),
      ubicacion(3, '2026-11-25T13:29:59.000Z'),
    ];
    const useCase = new ListarUltimasUbicacionesUseCase(
      consulta,
      new RelojFijo(AHORA),
    );

    const resultado = await useCase.execute();

    expect(consulta.desdeConsultado).toEqual(
      new Date('2026-11-25T13:30:00.000Z'),
    );
    expect(resultado.map((u) => u.usuarioId)).toEqual([1, 2]);
  });
});
