import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import { EjecucionTareaEntity } from '../../domain/entities/ejecucion-tarea.entity';
import { OrigenEjecucionTarea } from '../../domain/enums/ejecucion-tarea.enum';
import { EjecucionTareaRepositoryFake } from '../../test/fakes/ejecucion-tarea-repository.fake';
import { LimpiarEjecucionesTareaUseCase } from './limpiar-ejecuciones-tarea.use-case';

async function sembrar(repo: EjecucionTareaRepositoryFake, fecha: string) {
  await repo.crear(
    EjecucionTareaEntity.iniciar(
      {
        clave: `LIMPIEZA_EJECUCIONES:${fecha}`,
        tarea: 'LIMPIEZA_EJECUCIONES',
        fechaOperativa: fecha,
        origen: OrigenEjecucionTarea.PROGRAMADA,
        ejecutadaPorId: null,
      },
      new Date(`${fecha}T09:00:00.000Z`),
    ),
  );
}

describe('LimpiarEjecucionesTareaUseCase', () => {
  it('borra lo de hace más de 180 días y conserva el día límite', async () => {
    // 03:00 de Guatemala del 2027-03-06.
    const reloj = new RelojFijo('2027-03-06T09:00:00.000Z');
    const repo = new EjecucionTareaRepositoryFake();
    for (const fecha of ['2026-09-06', '2026-09-07', '2027-03-06']) {
      await sembrar(repo, fecha);
    }

    const r = await new LimpiarEjecucionesTareaUseCase(repo, reloj).execute();

    expect(r).toEqual({ anterioresA: '2026-09-07', borradas: 1 });
    expect([...repo.filas.keys()]).toEqual([
      'LIMPIEZA_EJECUCIONES:2026-09-07',
      'LIMPIEZA_EJECUCIONES:2027-03-06',
    ]);
  });
});
